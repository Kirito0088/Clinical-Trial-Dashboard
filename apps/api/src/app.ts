/**
 * Clinical Trials Dashboard — Express API
 * 
 * Architecture:
 *   Supabase/Prisma DB  →  Data Access Layer  →  Monitoring Engine
 *                                                       ↓
 *                          AI (Gemini)  ←  Structured Flags + Evidence
 *                                ↓
 *                          Recommendation (validated contract)
 *                                ↓
 *                          Frontend (via /api/*)
 *
 * All DB queries → monitoring calculations → AI → response.
 * Fixture data used as fallback when DB is unavailable.
 */

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env, isTest } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { ok, wrap, HttpError } from './lib/http.js';
import { log } from './lib/logger.js';
import { aiStatus, chat, parseLooseJson } from './modules/ai/index.js';
import type {
  TrialCard,
  TrialDetail,
  PortfolioSummary,
  AppConfig,
  HealthCheck,
  FlaggedExportRow,
  TrialInsight,
} from '@ctd/shared';
import {
  trialsResponseSchema,
  trialDetailSchema,
  portfolioSummarySchema,
  appConfigSchema,
  healthCheckSchema,
  flaggedExportResponseSchema,
} from '@ctd/shared';

// ── Prisma (lazy — only connected when DATABASE_URL is set) ──────────────────
let prisma: import('@prisma/client').PrismaClient | null = null;
let dbConnected = false;

async function getDb() {
  if (prisma) return prisma;
  if (!env.DATABASE_URL) return null;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ log: ['warn', 'error'] });
    await prisma.$connect();
    dbConnected = true;
    log.info('✅ Supabase/Prisma connected');
    return prisma;
  } catch (err) {
    log.warn(`DB connection failed, using fixture data: ${err}`);
    prisma = null;
    dbConnected = false;
    return null;
  }
}

// ── In-memory TTL cache (eliminates repeat Supabase round-trips) ─────────────
interface CacheEntry<T> { value: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.value;
}
function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
function cacheInvalidate(pattern: string): void {
  for (const key of cache.keys()) { if (key.includes(pattern)) cache.delete(key); }
}

// ── Monitoring configuration ─────────────────────────────────────────────────
const AS_OF = new Date('2026-09-01T00:00:00.000Z');
const CONFIG: AppConfig = {
  id: 'singleton',
  asOfDate: AS_OF.toISOString(),
  milestoneHorizonDays: 30,
  enrollmentShortfallThreshold: 0.15,
  minExposurePatientMonths: 24,
  aeRateAlert: 15,
  seriousEventReviewWindowDays: 7,
  nonEnrollingSiteGraceDays: 45,
};

// ── Monitoring Engine ─────────────────────────────────────────────────────────
type FlagType = 
  | 'SERIOUS_UNRESOLVED' 
  | 'AE_RATE_ALERT' 
  | 'BEHIND_PLAN' 
  | 'ENROLLMENT_STALLED' 
  | 'NON_ENROLLING_SITE' 
  | 'OVERDUE_MILESTONE';

interface MonitoringFlag {
  type: FlagType;
  label: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  sourceId?: string;
  evidence: Record<string, unknown>;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low' | 'none';
  title: string;
  reason: string;
  action: string;
  sourceType: 'adverse_event' | 'enrollment' | 'milestone' | 'site' | 'none';
  sourceId: string | null;
  traceability: {
    flagType: string | null;
    evidence: Record<string, unknown>;
  };
  aiEnhanced: boolean;
  degraded: boolean;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function computeMilestoneState(planned: Date, actual: Date | null, asOf: Date, horizonDays: number) {
  if (actual) return { state: 'DONE' as const, daysUntil: daysBetween(asOf, planned) };
  const days = daysBetween(asOf, planned);
  if (days < 0) return { state: 'OVERDUE' as const, daysUntil: days };
  if (days <= horizonDays) return { state: 'DUE_SOON' as const, daysUntil: days };
  return { state: 'FUTURE' as const, daysUntil: days };
}

function computeHealthScore(flags: MonitoringFlag[], enrollmentPct: number): number {
  let score = 100;
  for (const f of flags) {
    if (f.type === 'SERIOUS_UNRESOLVED') score -= 25;
    else if (f.type === 'AE_RATE_ALERT') score -= 20;
    else if (f.type === 'ENROLLMENT_STALLED') score -= 20;
    else if (f.type === 'BEHIND_PLAN') score -= 15;
    else if (f.type === 'NON_ENROLLING_SITE') score -= 10;
    else if (f.type === 'OVERDUE_MILESTONE') score -= 15;
  }
  if (enrollmentPct < 0.5) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function healthStatus(score: number): 'HEALTHY' | 'WATCH' | 'CRITICAL' {
  if (score >= 75) return 'HEALTHY';
  if (score >= 50) return 'WATCH';
  return 'CRITICAL';
}

/**
 * Deterministic fallback recommendation — no AI needed.
 * Returns a fully traceable recommendation from the monitoring flags.
 */
function deterministicRecommendation(
  trialId: string,
  flags: MonitoringFlag[],
  healthScore: number,
): Recommendation {
  // Priority 1: unresolved serious AE
  const sae = flags.find((f) => f.type === 'SERIOUS_UNRESOLVED');
  if (sae) {
    return {
      priority: 'high',
      title: 'Immediate safety review required',
      reason: sae.reason,
      action: 'Review Adverse Events',
      sourceType: 'adverse_event',
      sourceId: (sae.evidence.firstEventId as string) ?? null,
      traceability: { flagType: sae.type, evidence: sae.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // Priority 2: AE rate alert
  const aeRate = flags.find((f) => f.type === 'AE_RATE_ALERT');
  if (aeRate) {
    return {
      priority: 'high',
      title: 'Adverse event rate exceeds threshold',
      reason: aeRate.reason,
      action: 'Review AE Reports',
      sourceType: 'adverse_event',
      sourceId: null,
      traceability: { flagType: aeRate.type, evidence: aeRate.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // Priority 3: stalled enrollment
  const stalled = flags.find((f) => f.type === 'ENROLLMENT_STALLED');
  if (stalled) {
    return {
      priority: 'high',
      title: 'Enrollment has stalled',
      reason: stalled.reason,
      action: 'Review Enrollment',
      sourceType: 'enrollment',
      sourceId: null,
      traceability: { flagType: stalled.type, evidence: stalled.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // Priority 4: behind plan
  const behind = flags.find((f) => f.type === 'BEHIND_PLAN');
  if (behind) {
    return {
      priority: 'medium',
      title: 'Enrollment is behind planned trajectory',
      reason: behind.reason,
      action: 'Review Enrollment',
      sourceType: 'enrollment',
      sourceId: null,
      traceability: { flagType: behind.type, evidence: behind.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // Priority 5: non-enrolling site
  const nonEnrolling = flags.find((f) => f.type === 'NON_ENROLLING_SITE');
  if (nonEnrolling) {
    return {
      priority: 'medium',
      title: 'Site activation follow-up required',
      reason: nonEnrolling.reason,
      action: 'Review Sites',
      sourceType: 'site',
      sourceId: (nonEnrolling.evidence.siteId as string) ?? null,
      traceability: { flagType: nonEnrolling.type, evidence: nonEnrolling.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // Priority 6: overdue milestone
  const overdue = flags.find((f) => f.type === 'OVERDUE_MILESTONE');
  if (overdue) {
    return {
      priority: 'medium',
      title: 'Milestone is overdue',
      reason: overdue.reason,
      action: 'Review Milestones',
      sourceType: 'milestone',
      sourceId: (overdue.evidence.milestoneId as string) ?? null,
      traceability: { flagType: overdue.type, evidence: overdue.evidence },
      aiEnhanced: false,
      degraded: false,
    };
  }

  // No flags — routine monitoring
  return {
    priority: 'none',
    title: 'Continue routine monitoring',
    reason: `Health score is ${healthScore}/100. All enrollment, safety, and milestone indicators are within expected ranges.`,
    action: 'View Overview',
    sourceType: 'none',
    sourceId: null,
    traceability: { flagType: null, evidence: { healthScore } },
    aiEnhanced: false,
    degraded: false,
  };
}

/**
 * Call Gemini to enhance the deterministic recommendation with a clear,
 * clinically-grounded narrative. Falls back to deterministic if AI fails.
 */
async function aiEnhanceRecommendation(
  baseRec: Recommendation,
  trial: { id: string; title: string; phase: string; status: string },
  flags: MonitoringFlag[],
): Promise<Recommendation> {
  const flagSummary = flags
    .map((f) => `- [${f.type}] ${f.reason}`)
    .join('\n') || '- No active monitoring flags';

  const prompt = `You are an operational clinical trial monitoring assistant for the ${trial.title} (${trial.id}, Phase ${trial.phase.replace('PHASE_', '')}).

Current monitoring flags detected by the deterministic monitoring engine:
${flagSummary}

Base recommendation from monitoring rules:
Priority: ${baseRec.priority}
Title: ${baseRec.title}
Action: ${baseRec.action}

Write a concise, professional clinical operations recommendation. Use plain English. Do not invent clinical facts. Use ONLY the monitoring data provided.

Return ONLY valid JSON with exactly these fields:
{
  "title": "one-line recommendation title (max 60 chars)",
  "reason": "2-3 sentence explanation grounded in the monitoring data above",
  "action": "action button label (max 30 chars)"
}`;

  try {
    const result = await chat(
      [{ role: 'user', content: prompt }],
      { maxTokens: 512, temperature: 0.2 },
    );

    const parsed = parseLooseJson<{ title: string; reason: string; action: string }>(result.content);

    if (
      parsed &&
      typeof parsed.title === 'string' &&
      typeof parsed.reason === 'string' &&
      typeof parsed.action === 'string'
    ) {
      return {
        ...baseRec,
        title: parsed.title,
        reason: parsed.reason,
        action: parsed.action,
        aiEnhanced: true,
        degraded: result.degraded,
      };
    }
  } catch (err) {
    log.warn(`AI recommendation failed for ${trial.id}: ${err}`);
  }

  return { ...baseRec, aiEnhanced: false, degraded: true };
}

// ── Data Access Layer (DB-backed with fixture fallback) ───────────────────────

/**
 * Load a trial's full detail from Supabase.
 * Returns null if not found or DB unavailable.
 */
async function loadTrialFromDb(trialId: string): Promise<TrialDetail | null> {
  const cacheKey = `trial:${trialId}`;
  const cached = cacheGet<TrialDetail>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  const trial = await db.trial.findUnique({
    where: { id: trialId },
    include: {
      sites: true,
      subjects: { orderBy: { screenedDate: 'asc' } },
      adverseEvents: { orderBy: { onsetDate: 'desc' } },
      milestones: { orderBy: { plannedDate: 'asc' } },
      insight: true,
    },
  });

  if (!trial) return null;

  // Compute enrollment funnel
  const subjects = trial.subjects ?? [];
  const screened = subjects.length;
  const enrolled = subjects.filter((s) => s.enrolledDate !== null).length;
  const withdrawn = subjects.filter((s) => s.withdrawnDate !== null).length;
  const active = enrolled - withdrawn;
  const screenFailed = subjects.filter((s) => s.enrolledDate === null && s.screenFailReason).length;
  const enrollmentProgress = trial.targetEnrollment > 0 ? enrolled / trial.targetEnrollment : 0;

  // Compute AE summary
  const aes = trial.adverseEvents ?? [];
  const asOf = AS_OF;
  const reviewWindow = CONFIG.seriousEventReviewWindowDays;

  const aeSummary = {
    total: aes.length,
    serious: aes.filter((a) => a.seriousFlag).length,
    unresolved: aes.filter((a) => !a.resolvedDate).length,
    byGrade: {
      MILD: aes.filter((a) => a.severityGrade === 'MILD').length,
      MODERATE: aes.filter((a) => a.severityGrade === 'MODERATE').length,
      SEVERE: aes.filter((a) => a.severityGrade === 'SEVERE').length,
      CRITICAL: aes.filter((a) => a.severityGrade === 'CRITICAL').length,
    },
  };

  // Compute monitoring flags
  const flags: MonitoringFlag[] = [];

  // SERIOUS_UNRESOLVED: serious + unresolved + older than review window
  const unresolvedSerious = aes.filter(
    (a) => a.seriousFlag && !a.resolvedDate &&
      daysBetween(a.onsetDate, asOf) > reviewWindow
  );
  if (unresolvedSerious.length > 0) {
    const ids = unresolvedSerious.map((a) => a.id).join(', ');
    flags.push({
      type: 'SERIOUS_UNRESOLVED',
      label: 'Serious Unresolved',
      severity: 'HIGH',
      reason: `${unresolvedSerious.length} serious adverse event${unresolvedSerious.length > 1 ? 's' : ''} unresolved beyond the ${reviewWindow}-day review window (${ids})`,
      sourceId: unresolvedSerious[0].id,
      evidence: {
        unresolvedSeriousCount: unresolvedSerious.length,
        reviewWindowDays: reviewWindow,
        firstEventId: unresolvedSerious[0].id,
        eventIds: unresolvedSerious.map((a) => a.id),
      },
    });
  }

  // AE_RATE_ALERT: patient-months exposure > minExposure and rate > threshold
  // Simplified: rate = (aes.total / enrolled) * 100, requires ≥ minExposure patient-months
  const patientMonths = subjects
    .filter((s) => s.enrolledDate)
    .reduce((sum, s) => {
      const end = s.withdrawnDate ?? asOf;
      return sum + daysBetween(s.enrolledDate!, end) / 30.44;
    }, 0);

  if (patientMonths >= CONFIG.minExposurePatientMonths && aeSummary.total > 0) {
    const rate = (aeSummary.total / patientMonths) * 100;
    if (rate > CONFIG.aeRateAlert) {
      flags.push({
        type: 'AE_RATE_ALERT',
        label: 'AE Rate Alert',
        severity: 'HIGH',
        reason: `AE rate ${rate.toFixed(1)} per 100 patient-months exceeds threshold of ${CONFIG.aeRateAlert}`,
        evidence: { rate: parseFloat(rate.toFixed(1)), threshold: CONFIG.aeRateAlert, patientMonths: parseFloat(patientMonths.toFixed(1)) },
      });
    }
  }

  // BEHIND_PLAN: elapsed fraction - enrolled fraction > shortfall threshold
  const elapsed = daysBetween(trial.plannedStart, asOf);
  const totalDays = daysBetween(trial.plannedStart, trial.plannedEnd);
  const expectedFraction = totalDays > 0 ? Math.min(1, elapsed / totalDays) : 0;
  const shortfall = expectedFraction - enrollmentProgress;
  if (shortfall > CONFIG.enrollmentShortfallThreshold && enrolled < trial.targetEnrollment) {
    const expectedCount = Math.round(expectedFraction * trial.targetEnrollment);
    flags.push({
      type: 'BEHIND_PLAN',
      label: 'Behind Plan',
      severity: 'MEDIUM',
      reason: `Enrollment at ${Math.round(enrollmentProgress * 100)}% vs expected ${Math.round(expectedFraction * 100)}% — shortfall of ${expectedCount - enrolled} subjects`,
      evidence: {
        currentEnrollment: enrolled,
        expectedEnrollment: expectedCount,
        targetEnrollment: trial.targetEnrollment,
        shortfallFraction: parseFloat(shortfall.toFixed(3)),
      },
    });
  }

  // NON_ENROLLING_SITE: site active > grace period with 0 subjects enrolled
  const graceDays = CONFIG.nonEnrollingSiteGraceDays;
  for (const site of trial.sites) {
    const siteSubjects = subjects.filter(
      (s) => s.siteId === site.id && s.enrolledDate !== null
    );
    const daysActive = daysBetween(site.activationDate, asOf);
    if (siteSubjects.length === 0 && daysActive > graceDays) {
      flags.push({
        type: 'NON_ENROLLING_SITE',
        label: 'Non-Enrolling Site',
        severity: 'MEDIUM',
        reason: `Site ${site.id} (${site.siteName}) has 0 enrollments after ${daysActive} days past activation (grace: ${graceDays} days)`,
        sourceId: site.id,
        evidence: { siteId: site.id, siteName: site.siteName, daysActive, graceDays },
      });
    }
  }

  // OVERDUE_MILESTONE
  for (const m of trial.milestones) {
    const { state, daysUntil } = computeMilestoneState(
      m.plannedDate, m.actualDate, asOf, CONFIG.milestoneHorizonDays
    );
    if (state === 'OVERDUE') {
      flags.push({
        type: 'OVERDUE_MILESTONE',
        label: 'Overdue Milestone',
        severity: 'MEDIUM',
        reason: `Milestone "${m.type}" was due ${Math.abs(daysUntil)} days ago (${m.plannedDate.toISOString().split('T')[0]})`,
        sourceId: m.id,
        evidence: { milestoneId: m.id, type: m.type, plannedDate: m.plannedDate.toISOString(), daysOverdue: Math.abs(daysUntil) },
      });
    }
  }

  // Health score
  const score = computeHealthScore(flags, enrollmentProgress);
  const status = healthStatus(score);

  // Next milestone
  const upcomingMilestones = trial.milestones
    .map((m) => ({ ...m, ...computeMilestoneState(m.plannedDate, m.actualDate, asOf, CONFIG.milestoneHorizonDays) }))
    .filter((m) => m.state !== 'DONE')
    .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime());

  return {
    id: trial.id,
    title: trial.title,
    sponsor: trial.sponsor,
    phase: trial.phase,
    status: trial.status,
    conditionArea: trial.conditionArea,
    interventionType: trial.interventionType,
    targetEnrollment: trial.targetEnrollment,
    plannedStart: trial.plannedStart.toISOString(),
    plannedEnd: trial.plannedEnd.toISOString(),
    enrollmentProgress,
    funnel: { screened, enrolled, active, withdrawn, screenFailed },
    aeSummary,
    healthScore: score,
    healthStatus: status,
    flags: flags.map((f) => ({
      type: f.type,
      label: f.label,
      reason: f.reason,
      sourceId: f.sourceId,
    })),
    sites: trial.sites.map((s) => {
      const siteSubjects = subjects.filter((sub) => sub.siteId === s.id);
      const siteEnrolled = siteSubjects.filter((sub) => sub.enrolledDate).length;
      const siteActive = siteEnrolled - siteSubjects.filter((sub) => sub.withdrawnDate).length;
      const siteSF = siteSubjects.filter((sub) => sub.screenFailReason).length;
      const siteWithdrawn = siteSubjects.filter((sub) => sub.withdrawnDate).length;
      const daysActive = daysBetween(s.activationDate, asOf);
      const isNonEnrolling = siteEnrolled === 0 && daysActive > graceDays;
      return {
        id: s.id,
        siteName: s.siteName,
        region: s.region,
        targetEnrollment: s.targetEnrollment,
        activeSubjects: siteActive,
        enrolledSubjects: siteEnrolled,
        screenFailed: siteSF,
        withdrawn: siteWithdrawn,
        activationDate: s.activationDate.toISOString(),
        isNonEnrolling,
      };
    }),
    adverseEvents: aes.map((ae) => ({
      id: ae.id,
      trialId: ae.trialId,
      siteId: ae.siteId,
      subjectRef: ae.subjectRef,
      onsetDate: ae.onsetDate.toISOString(),
      resolvedDate: ae.resolvedDate?.toISOString() ?? null,
      term: ae.term,
      symptoms: ae.symptoms as string[],
      severityGrade: ae.severityGrade,
      seriousFlag: ae.seriousFlag,
      outcome: ae.outcome,
      drugName: ae.drugName,
      drugClass: ae.drugClass,
      patientAge: ae.patientAge,
      patientSex: ae.patientSex,
      suspectedRelationship: ae.suspectedRelationship,
      riskLevelSeed: ae.riskLevelSeed,
      reviewPrioritySeed: ae.reviewPrioritySeed,
      riskFactorsSeed: ae.riskFactorsSeed,
      staffRecommendationSeed: ae.staffRecommendationSeed,
      caseSummary: ae.caseSummary,
      eventNarrative: ae.eventNarrative,
      aiRecommendation: ae.aiRecommendation,
      aiGeneratedAt: ae.aiGeneratedAt?.toISOString() ?? null,
    })),
    milestones: trial.milestones.map((m) => {
      const { state, daysUntil } = computeMilestoneState(
        m.plannedDate, m.actualDate, asOf, CONFIG.milestoneHorizonDays
      );
      return {
        id: m.id,
        trialId: m.trialId,
        type: m.type,
        plannedDate: m.plannedDate.toISOString(),
        actualDate: m.actualDate?.toISOString() ?? null,
        state,
        daysUntil,
      };
    }),
    insight: trial.insight ? {
      trialId: trial.insight.trialId,
      healthScore: trial.insight.healthScore,
      healthStatus: trial.insight.healthStatus,
      scoreBreakdown: trial.insight.scoreBreakdown as Record<string, number>,
      aiSummary: trial.insight.aiSummary,
      source: trial.insight.source,
      generatedAt: trial.insight.generatedAt.toISOString(),
    } : null,
  };
  cacheSet(cacheKey, result, 120_000); // 2 min TTL
  return result;
}

/**
 * Load all trials as cards from Supabase.
 */
async function loadTrialsFromDb(filters: Record<string, string> = {}): Promise<TrialCard[] | null> {
  const cacheKey = `trials:${JSON.stringify(filters)}`;
  const cached = cacheGet<TrialCard[]>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  const where: Record<string, unknown> = {};
  if (filters.phase) where.phase = filters.phase;
  if (filters.status) where.status = filters.status;
  if (filters.region) where.sites = { some: { region: { contains: filters.region, mode: 'insensitive' } } };
  if (filters.q) {
    where.OR = [
      { id: { contains: filters.q, mode: 'insensitive' } },
      { title: { contains: filters.q, mode: 'insensitive' } },
      { conditionArea: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  const trials = await db.trial.findMany({
    where,
    include: {
      sites: true,
      subjects: true,
      adverseEvents: true,
      milestones: true,
      insight: true,
    },
    orderBy: { id: 'asc' },
  });

  const result = trials.map((trial) => {
    const subjects = trial.subjects ?? [];
    const enrolled = subjects.filter((s) => s.enrolledDate).length;
    const withdrawn = subjects.filter((s) => s.withdrawnDate).length;
    const active = enrolled - withdrawn;
    const screened = subjects.length;
    const screenFailed = subjects.filter((s) => s.screenFailReason && !s.enrolledDate).length;
    const enrollmentProgress = trial.targetEnrollment > 0 ? enrolled / trial.targetEnrollment : 0;
    const aes = trial.adverseEvents ?? [];
    const aeSummary = {
      total: aes.length,
      serious: aes.filter((a) => a.seriousFlag).length,
      unresolved: aes.filter((a) => !a.resolvedDate).length,
      byGrade: {
        MILD: aes.filter((a) => a.severityGrade === 'MILD').length,
        MODERATE: aes.filter((a) => a.severityGrade === 'MODERATE').length,
        SEVERE: aes.filter((a) => a.severityGrade === 'SEVERE').length,
        CRITICAL: aes.filter((a) => a.severityGrade === 'CRITICAL').length,
      },
    };

    // Compute flags for card-level summary
    const flags: { type: string; label: string; reason: string; sourceId?: string }[] = [];
    const reviewWindow = CONFIG.seriousEventReviewWindowDays;
    const unresolvedSerious = aes.filter(
      (a) => a.seriousFlag && !a.resolvedDate && daysBetween(a.onsetDate, AS_OF) > reviewWindow
    );
    if (unresolvedSerious.length > 0) {
      flags.push({ type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: `${unresolvedSerious.length} serious AE(s) unresolved beyond ${reviewWindow}-day review window`, sourceId: unresolvedSerious[0].id });
    }

    const elapsed = daysBetween(trial.plannedStart, AS_OF);
    const totalDays = daysBetween(trial.plannedStart, trial.plannedEnd);
    const expectedFraction = totalDays > 0 ? Math.min(1, elapsed / totalDays) : 0;
    const shortfall = expectedFraction - enrollmentProgress;
    if (shortfall > CONFIG.enrollmentShortfallThreshold && enrolled < trial.targetEnrollment) {
      const expectedCount = Math.round(expectedFraction * trial.targetEnrollment);
      flags.push({ type: 'BEHIND_PLAN', label: 'Behind Plan', reason: `Enrollment at ${Math.round(enrollmentProgress * 100)}% vs expected ${Math.round(expectedFraction * 100)}% — shortfall of ${expectedCount - enrolled} subjects` });
    }

    // Check for non-enrolling sites
    for (const site of trial.sites) {
      const siteSubjects = subjects.filter((s) => s.siteId === site.id && s.enrolledDate);
      const daysActive = daysBetween(site.activationDate, AS_OF);
      if (siteSubjects.length === 0 && daysActive > CONFIG.nonEnrollingSiteGraceDays) {
        flags.push({ type: 'NON_ENROLLING_SITE', label: 'Non-Enrolling Site', reason: `Site ${site.siteName} has 0 enrollments after ${daysActive} days`, sourceId: site.id });
      }
    }

    // Check for overdue milestones
    for (const m of trial.milestones) {
      const { state, daysUntil } = computeMilestoneState(m.plannedDate, m.actualDate, AS_OF, CONFIG.milestoneHorizonDays);
      if (state === 'OVERDUE') {
        flags.push({ type: 'OVERDUE_MILESTONE', label: 'Overdue Milestone', reason: `Milestone "${m.type}" was due ${Math.abs(daysUntil)} days ago`, sourceId: m.id });
      }
    }

    const score = computeHealthScore(
      flags.map((f) => ({ ...f, severity: 'HIGH' as const, evidence: {} })),
      enrollmentProgress
    );

    // Next upcoming milestone
    const nextMs = trial.milestones
      .map((m) => ({ ...m, ...computeMilestoneState(m.plannedDate, m.actualDate, AS_OF, CONFIG.milestoneHorizonDays) }))
      .filter((m) => m.state !== 'DONE')
      .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime())[0];

    return {
      id: trial.id,
      title: trial.title,
      sponsor: trial.sponsor,
      phase: trial.phase,
      status: trial.status,
      conditionArea: trial.conditionArea,
      interventionType: trial.interventionType,
      targetEnrollment: trial.targetEnrollment,
      enrollmentProgress,
      funnel: { screened, enrolled, active, withdrawn, screenFailed },
      aeSummary,
      nextMilestone: nextMs
        ? { id: nextMs.id, type: nextMs.type, plannedDate: nextMs.plannedDate.toISOString(), state: nextMs.state, daysUntil: nextMs.daysUntil }
        : null,
      healthScore: score,
      healthStatus: healthStatus(score),
      flags,
      flagCount: flags.length,
    };
  });
  cacheSet(cacheKey, result, 60_000); // 1 min TTL
  return result;
}

// ── Fixture fallback data ─────────────────────────────────────────────────────
// Used when DB is not available. Validated against shared Zod schemas at load.

const FIXTURE_TRIALS: TrialCard[] = [
  {
    id: 'CT-DEMO-001', title: 'Cardiology Phase III — Amlodipine Besylate', sponsor: 'NovaPharma Inc.',
    phase: 'PHASE_3', status: 'ACTIVE', conditionArea: 'Cardiology', interventionType: 'Drug',
    targetEnrollment: 300, enrollmentProgress: 0.72,
    funnel: { screened: 280, enrolled: 216, active: 198, withdrawn: 18, screenFailed: 64 },
    aeSummary: { total: 45, serious: 8, unresolved: 3, byGrade: { MILD: 20, MODERATE: 15, SEVERE: 7, CRITICAL: 3 } },
    nextMilestone: { id: 'M-001-03', type: 'DSMB Review', plannedDate: '2026-09-15T00:00:00.000Z', state: 'DUE_SOON', daysUntil: 14 },
    healthScore: 62, healthStatus: 'WATCH',
    flags: [
      { type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: '3 serious AEs unresolved beyond 7-day review window', sourceId: 'AE-007865' },
      { type: 'AE_RATE_ALERT', label: 'AE Rate Alert', reason: 'AE rate 18.2 per 100 patient-months exceeds threshold of 15' },
    ],
    flagCount: 2,
  },
  {
    id: 'CT-DEMO-002', title: 'Oncology Phase II — Pembrolizumab Combination', sponsor: 'BioGenesis Labs',
    phase: 'PHASE_2', status: 'RECRUITING', conditionArea: 'Oncology', interventionType: 'Biologic',
    targetEnrollment: 200, enrollmentProgress: 0.45,
    funnel: { screened: 150, enrolled: 90, active: 82, withdrawn: 8, screenFailed: 60 },
    aeSummary: { total: 28, serious: 5, unresolved: 1, byGrade: { MILD: 12, MODERATE: 9, SEVERE: 5, CRITICAL: 2 } },
    nextMilestone: { id: 'M-002-02', type: 'DSMB Review', plannedDate: '2026-09-20T00:00:00.000Z', state: 'DUE_SOON', daysUntil: 19 },
    healthScore: 48, healthStatus: 'WATCH',
    flags: [
      { type: 'BEHIND_PLAN', label: 'Behind Plan', reason: 'Enrollment at 45% vs expected 62% — shortfall of 34 subjects' },
      { type: 'NON_ENROLLING_SITE', label: 'Non-Enrolling Site', reason: 'Site S-002-03 (Mumbai Central) has 0 enrollments after 52 days' },
    ],
    flagCount: 2,
  },
  {
    id: 'CT-DEMO-003', title: 'Neurology Phase I — GLP-1 Receptor Agonist', sponsor: 'NeuroVita Therapeutics',
    phase: 'PHASE_1', status: 'RECRUITING', conditionArea: 'Neurology', interventionType: 'Drug',
    targetEnrollment: 80, enrollmentProgress: 0.88,
    funnel: { screened: 85, enrolled: 70, active: 68, withdrawn: 2, screenFailed: 15 },
    aeSummary: { total: 12, serious: 1, unresolved: 0, byGrade: { MILD: 8, MODERATE: 3, SEVERE: 1, CRITICAL: 0 } },
    nextMilestone: { id: 'M-003-04', type: 'LPLV', plannedDate: '2026-10-15T00:00:00.000Z', state: 'FUTURE', daysUntil: 44 },
    healthScore: 85, healthStatus: 'HEALTHY',
    flags: [], flagCount: 0,
  },
  {
    id: 'CT-DEMO-004', title: 'Immunology Phase IV — Adalimumab Biosimilar', sponsor: 'SafeBridge Pharma',
    phase: 'PHASE_4', status: 'ACTIVE', conditionArea: 'Immunology', interventionType: 'Biologic',
    targetEnrollment: 400, enrollmentProgress: 0.93,
    funnel: { screened: 420, enrolled: 372, active: 355, withdrawn: 17, screenFailed: 48 },
    aeSummary: { total: 62, serious: 12, unresolved: 5, byGrade: { MILD: 25, MODERATE: 20, SEVERE: 10, CRITICAL: 7 } },
    nextMilestone: { id: 'M-004-05', type: 'DB Lock', plannedDate: '2026-08-25T00:00:00.000Z', state: 'OVERDUE', daysUntil: -7 },
    healthScore: 35, healthStatus: 'CRITICAL',
    flags: [
      { type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: '5 serious AEs unresolved beyond 7-day review window', sourceId: 'AE-004-001' },
      { type: 'AE_RATE_ALERT', label: 'AE Rate Alert', reason: 'AE rate 22.1 per 100 patient-months exceeds threshold of 15' },
      { type: 'OVERDUE_MILESTONE', label: 'Overdue Milestone', reason: 'DB Lock milestone was due 7 days ago', sourceId: 'M-004-05' },
    ],
    flagCount: 3,
  },
  {
    id: 'CT-DEMO-005', title: 'Dermatology Phase II — Dupilumab Extension', sponsor: 'DermaCure Research',
    phase: 'PHASE_2', status: 'PAUSED', conditionArea: 'Dermatology', interventionType: 'Drug',
    targetEnrollment: 150, enrollmentProgress: 0.60,
    funnel: { screened: 120, enrolled: 90, active: 85, withdrawn: 5, screenFailed: 30 },
    aeSummary: { total: 18, serious: 2, unresolved: 0, byGrade: { MILD: 10, MODERATE: 5, SEVERE: 2, CRITICAL: 1 } },
    nextMilestone: null,
    healthScore: 71, healthStatus: 'HEALTHY',
    flags: [], flagCount: 0,
  },
];

const FIXTURE_PORTFOLIO: PortfolioSummary = {
  totalTrials: 5, activeTrials: 3, totalSubjects: 838, enrolledSubjects: 838,
  totalAdverseEvents: 165, seriousAdverseEvents: 28, unresolvedEvents: 9,
  flaggedTrials: 3, avgHealthScore: 60,
  trialsByPhase: { PHASE_1: 1, PHASE_2: 2, PHASE_3: 1, PHASE_4: 1 },
  trialsByStatus: { RECRUITING: 2, ACTIVE: 2, PAUSED: 1, COMPLETED: 0 },
};

// Validate fixtures at module load
trialsResponseSchema.parse(FIXTURE_TRIALS);
appConfigSchema.parse(CONFIG);
portfolioSummarySchema.parse(FIXTURE_PORTFOLIO);

// ── Express App ───────────────────────────────────────────────────────────────

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!isTest) app.use(morgan('dev'));

  // Warm DB connection on startup (non-blocking)
  getDb().catch(() => {});

  // ── GET /api/health ────────────────────────────────────────────────────────
  app.get('/api/health', wrap(async (_req, res) => {
    const data: HealthCheck = {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      env: env.NODE_ENV,
      db: { connected: dbConnected },
      ai: aiStatus(),
    };
    ok(res, data);
  }));

  // ── GET /api/config ────────────────────────────────────────────────────────
  app.get('/api/config', (_req, res) => {
    ok(res, CONFIG);
  });

  // ── GET /api/trials ────────────────────────────────────────────────────────
  app.get('/api/trials', wrap(async (req, res) => {
    const { phase, status, region, q } = req.query as Record<string, string>;
    const filters: Record<string, string> = {};
    if (phase) filters.phase = phase;
    if (status) filters.status = status;
    if (region) filters.region = region;
    if (q) filters.q = q;

    let trials = await loadTrialsFromDb(filters);

    if (!trials) {
      // Fixture fallback with client-side filter
      trials = FIXTURE_TRIALS.filter((t) => {
        if (phase && t.phase !== phase) return false;
        if (status && t.status !== status) return false;
        if (region && !t.conditionArea.toLowerCase().includes(region.toLowerCase()) && !t.id.toLowerCase().includes(region.toLowerCase())) return false;
        if (q) {
          const query = q.toLowerCase();
          return t.id.toLowerCase().includes(query) || t.title.toLowerCase().includes(query) || t.conditionArea.toLowerCase().includes(query);
        }
        return true;
      });
    }

    // Sort by health score ascending (most critical first)
    trials.sort((a, b) => a.healthScore - b.healthScore);
    ok(res, trials);
  }));

  // ── GET /api/trials/:id ────────────────────────────────────────────────────
  app.get('/api/trials/:id', wrap(async (req, res) => {
    const { id } = req.params;

    // Try DB first
    const detail = await loadTrialFromDb(id);
    if (detail) {
      ok(res, detail);
      return;
    }

    // Fixture fallback — build minimal detail from card
    const card = FIXTURE_TRIALS.find((t) => t.id === id);
    if (!card) throw HttpError.notFound(`Trial ${id} not found`);

    const minimalDetail: TrialDetail = {
      ...card,
      plannedStart: '2025-11-01T00:00:00.000Z',
      plannedEnd: '2027-02-28T00:00:00.000Z',
      sites: [],
      adverseEvents: [],
      milestones: [],
      insight: null,
    };
    ok(res, minimalDetail);
  }));

  // ── GET /api/trials/:id/recommendation ────────────────────────────────────
  app.get('/api/trials/:id/recommendation', wrap(async (req, res) => {
    const { id } = req.params;

    // Get trial detail (includes monitoring flags via DB or fixture)
    let trial: TrialDetail | null = await loadTrialFromDb(id);

    // If not in DB, use fixture card to derive a recommendation
    if (!trial) {
      const card = FIXTURE_TRIALS.find((t) => t.id === id);
      if (!card) throw HttpError.notFound(`Trial ${id} not found`);
      trial = { ...card, plannedStart: '2025-01-01T00:00:00.000Z', plannedEnd: '2027-01-01T00:00:00.000Z', sites: [], adverseEvents: [], milestones: [], insight: null };
    }

    // Reconstruct typed monitoring flags from trial detail
    const typedFlags: MonitoringFlag[] = (trial.flags ?? []).map((f) => ({
      type: f.type as FlagType,
      label: f.label,
      severity: 'HIGH' as const,
      reason: f.reason,
      sourceId: f.sourceId,
      evidence: { sourceId: f.sourceId },
    }));

    // Deterministic base recommendation
    const baseRec = deterministicRecommendation(id, typedFlags, trial.healthScore);

    // AI enhancement (with graceful fallback)
    const finalRec = await aiEnhanceRecommendation(baseRec, {
      id: trial.id,
      title: trial.title,
      phase: trial.phase,
      status: trial.status,
    }, typedFlags);

    ok(res, finalRec);
  }));

  // ── GET /api/portfolio/summary ─────────────────────────────────────────────
  app.get('/api/portfolio/summary', wrap(async (_req, res) => {
    const db = await getDb();
    if (!db) {
      ok(res, FIXTURE_PORTFOLIO);
      return;
    }

    const [trials, subjects, aes] = await Promise.all([
      db.trial.findMany({ include: { insight: true } }),
      db.subject.count(),
      db.adverseEvent.findMany({ select: { seriousFlag: true, resolvedDate: true } }),
    ]);

    const enrolled = await db.subject.count({ where: { enrolledDate: { not: null } } });
    const totalAEs = aes.length;
    const seriousAEs = aes.filter((a) => a.seriousFlag).length;
    const unresolvedAEs = aes.filter((a) => !a.resolvedDate).length;

    const byPhase = { PHASE_1: 0, PHASE_2: 0, PHASE_3: 0, PHASE_4: 0 };
    const byStatus = { RECRUITING: 0, ACTIVE: 0, PAUSED: 0, COMPLETED: 0 };
    let healthSum = 0;

    for (const t of trials) {
      byPhase[t.phase as keyof typeof byPhase]++;
      byStatus[t.status as keyof typeof byStatus]++;
      healthSum += t.insight?.healthScore ?? 50;
    }

    const summary: PortfolioSummary = {
      totalTrials: trials.length,
      activeTrials: byStatus.ACTIVE + byStatus.RECRUITING,
      totalSubjects: subjects,
      enrolledSubjects: enrolled,
      totalAdverseEvents: totalAEs,
      seriousAdverseEvents: seriousAEs,
      unresolvedEvents: unresolvedAEs,
      flaggedTrials: FIXTURE_TRIALS.filter((t) => t.flagCount > 0).length,
      avgHealthScore: trials.length ? Math.round(healthSum / trials.length) : 0,
      trialsByPhase: byPhase,
      trialsByStatus: byStatus,
    };

    ok(res, summary);
  }));

  // ── GET /api/search ────────────────────────────────────────────────────────
  app.get('/api/search', wrap(async (req, res) => {
    const q = (req.query.q as string ?? '').toLowerCase().trim();
    if (!q) { ok(res, { trials: [], adverseEvents: [], subjects: [] }); return; }

    const db = await getDb();
    if (!db) {
      // Fixture search
      const trials = FIXTURE_TRIALS.filter((t) =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.conditionArea.toLowerCase().includes(q)
      ).slice(0, 5);
      ok(res, { trials, adverseEvents: [], subjects: [] });
      return;
    }

    const [trials, aes, subjects] = await Promise.all([
      db.trial.findMany({
        where: { OR: [{ id: { contains: q, mode: 'insensitive' } }, { title: { contains: q, mode: 'insensitive' } }, { conditionArea: { contains: q, mode: 'insensitive' } }] },
        take: 5,
      }),
      db.adverseEvent.findMany({
        where: { OR: [{ id: { contains: q, mode: 'insensitive' } }, { term: { contains: q, mode: 'insensitive' } }] },
        take: 5,
      }),
      db.subject.findMany({
        where: { id: { contains: q, mode: 'insensitive' } },
        take: 5,
      }),
    ]);

    ok(res, { trials, adverseEvents: aes, subjects });
  }));

  // ── GET /api/export/flagged ────────────────────────────────────────────────
  app.get('/api/export/flagged', wrap(async (_req, res) => {
    const db = await getDb();

    if (!db) {
      const rows: FlaggedExportRow[] = FIXTURE_TRIALS
        .filter((t) => t.flagCount > 0)
        .flatMap((t) => t.flags.map((f) => ({
          trialId: t.id, title: t.title, phase: t.phase, status: t.status,
          healthScore: t.healthScore, healthStatus: t.healthStatus,
          flagType: f.type, flagReason: f.reason,
        })));
      ok(res, rows);
      return;
    }

    const trials = await loadTrialsFromDb();
    if (!trials) { ok(res, []); return; }
    const rows: FlaggedExportRow[] = trials
      .filter((t) => t.flagCount > 0)
      .flatMap((t) => t.flags.map((f) => ({
        trialId: t.id, title: t.title, phase: t.phase, status: t.status,
        healthScore: t.healthScore, healthStatus: t.healthStatus,
        flagType: f.type, flagReason: f.reason,
      })));
    ok(res, rows);
  }));

  // ── POST /api/insights/refresh ─────────────────────────────────────────────
  app.post('/api/insights/refresh', wrap(async (_req, res) => {
    const insight: TrialInsight = {
      trialId: 'CT-DEMO-001',
      healthScore: 62,
      healthStatus: 'WATCH',
      scoreBreakdown: { enrollment: 18, aeRate: 12, severeMix: 15, milestone: 17 },
      aiSummary: null,
      source: dbConnected ? 'gemini' : 'fallback',
      generatedAt: new Date().toISOString(),
    };
    ok(res, { refreshed: 1, insights: [insight] });
  }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
