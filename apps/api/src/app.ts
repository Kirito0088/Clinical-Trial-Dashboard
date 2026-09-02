import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env, isTest } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { ok } from './lib/http.js';
import { aiStatus } from './modules/ai/index.js';
import {
  type TrialCard,
  type TrialDetail,
  type PortfolioSummary,
  type AppConfig,
  type HealthCheck,
  type FlaggedExportRow,
  type TrialInsight,
  trialsResponseSchema,
  trialDetailSchema,
  portfolioSummarySchema,
  appConfigSchema,
  healthCheckSchema,
  flaggedExportResponseSchema,
} from '@ctd/shared';

// ── Fixture data ────────────────────────────────────────────────────────────
// Typed fixture data that exactly matches the shared zod schemas.
// Validated at module load so a mismatch is caught immediately.

const FIXTURE_CONFIG: AppConfig = {
  id: 'singleton',
  asOfDate: '2026-09-01T00:00:00.000Z',
  milestoneHorizonDays: 30,
  enrollmentShortfallThreshold: 0.15,
  minExposurePatientMonths: 24,
  aeRateAlert: 15,
  seriousEventReviewWindowDays: 7,
  nonEnrollingSiteGraceDays: 45,
};

const FIXTURE_TRIALS: TrialCard[] = [
  {
    id: 'CT-DEMO-001',
    title: 'Cardiology Phase III — Amlodipine Besylate',
    sponsor: 'NovaPharma Inc.',
    phase: 'PHASE_3',
    status: 'ACTIVE',
    conditionArea: 'Cardiology',
    interventionType: 'Drug',
    targetEnrollment: 300,
    enrollmentProgress: 0.72,
    funnel: { screened: 280, enrolled: 216, active: 198, withdrawn: 18, screenFailed: 64 },
    aeSummary: { total: 45, serious: 8, unresolved: 3, byGrade: { MILD: 20, MODERATE: 15, SEVERE: 7, CRITICAL: 3 } },
    nextMilestone: { id: 'M-DEMO-001-03', type: 'Interim Analysis', plannedDate: '2026-09-15T00:00:00.000Z', state: 'DUE_SOON', daysUntil: 14 },
    healthScore: 62,
    healthStatus: 'WATCH',
    flags: [
      { type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: '3 serious AEs unresolved beyond 7-day review window (AE-007865, AE-007866, AE-007867)' },
      { type: 'AE_RATE_ALERT', label: 'AE Rate Alert', reason: 'AE rate 18.2 per 100 patient-months exceeds threshold of 15' },
    ],
    flagCount: 2,
  },
  {
    id: 'CT-DEMO-002',
    title: 'Oncology Phase II — Pembrolizumab Combination',
    sponsor: 'BioGenesis Labs',
    phase: 'PHASE_2',
    status: 'RECRUITING',
    conditionArea: 'Oncology',
    interventionType: 'Biologic',
    targetEnrollment: 200,
    enrollmentProgress: 0.45,
    funnel: { screened: 150, enrolled: 90, active: 82, withdrawn: 8, screenFailed: 60 },
    aeSummary: { total: 28, serious: 5, unresolved: 1, byGrade: { MILD: 12, MODERATE: 9, SEVERE: 5, CRITICAL: 2 } },
    nextMilestone: { id: 'M-DEMO-002-02', type: 'DSMB Review', plannedDate: '2026-09-20T00:00:00.000Z', state: 'DUE_SOON', daysUntil: 19 },
    healthScore: 48,
    healthStatus: 'WATCH',
    flags: [
      { type: 'BEHIND_PLAN', label: 'Behind Plan', reason: 'Enrollment at 45% vs expected 62% — shortfall of 34 subjects' },
      { type: 'NON_ENROLLING_SITE', label: 'Non-Enrolling Site', reason: 'Site S-DEMO-002-03 (Mumbai Central) has 0 enrollments after 52 days past activation (grace: 45 days)' },
    ],
    flagCount: 2,
  },
  {
    id: 'CT-DEMO-003',
    title: 'Neurology Phase I — GLP-1 Receptor Agonist',
    sponsor: 'NeuroVita Therapeutics',
    phase: 'PHASE_1',
    status: 'RECRUITING',
    conditionArea: 'Neurology',
    interventionType: 'Drug',
    targetEnrollment: 80,
    enrollmentProgress: 0.88,
    funnel: { screened: 85, enrolled: 70, active: 68, withdrawn: 2, screenFailed: 15 },
    aeSummary: { total: 12, serious: 1, unresolved: 0, byGrade: { MILD: 8, MODERATE: 3, SEVERE: 1, CRITICAL: 0 } },
    nextMilestone: { id: 'M-DEMO-003-04', type: 'LPLV', plannedDate: '2026-10-15T00:00:00.000Z', state: 'FUTURE', daysUntil: 44 },
    healthScore: 85,
    healthStatus: 'HEALTHY',
    flags: [],
    flagCount: 0,
  },
  {
    id: 'CT-DEMO-004',
    title: 'Immunology Phase IV — Adalimumab Biosimilar',
    sponsor: 'SafeBridge Pharma',
    phase: 'PHASE_4',
    status: 'ACTIVE',
    conditionArea: 'Immunology',
    interventionType: 'Biologic',
    targetEnrollment: 400,
    enrollmentProgress: 0.93,
    funnel: { screened: 420, enrolled: 372, active: 355, withdrawn: 17, screenFailed: 48 },
    aeSummary: { total: 62, serious: 12, unresolved: 5, byGrade: { MILD: 25, MODERATE: 20, SEVERE: 10, CRITICAL: 7 } },
    nextMilestone: { id: 'M-DEMO-004-05', type: 'DB Lock', plannedDate: '2026-08-25T00:00:00.000Z', state: 'OVERDUE', daysUntil: -7 },
    healthScore: 35,
    healthStatus: 'CRITICAL',
    flags: [
      { type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: '5 serious AEs unresolved beyond 7-day review window' },
      { type: 'AE_RATE_ALERT', label: 'AE Rate Alert', reason: 'AE rate 22.1 per 100 patient-months exceeds threshold of 15' },
      { type: 'ENROLLMENT_STALLED', label: 'Enrollment Stalled', reason: 'No new enrollments in 21 days despite ACTIVE status' },
    ],
    flagCount: 3,
  },
  {
    id: 'CT-DEMO-005',
    title: 'Dermatology Phase II — Dupilumab Extension',
    sponsor: 'DermaCure Research',
    phase: 'PHASE_2',
    status: 'PAUSED',
    conditionArea: 'Dermatology',
    interventionType: 'Drug',
    targetEnrollment: 150,
    enrollmentProgress: 0.60,
    funnel: { screened: 120, enrolled: 90, active: 85, withdrawn: 5, screenFailed: 30 },
    aeSummary: { total: 18, serious: 2, unresolved: 0, byGrade: { MILD: 10, MODERATE: 5, SEVERE: 2, CRITICAL: 1 } },
    nextMilestone: null,
    healthScore: 71,
    healthStatus: 'HEALTHY',
    flags: [],
    flagCount: 0,
  },
];

const FIXTURE_TRIAL_DETAIL: TrialDetail = {
  id: 'CT-DEMO-001',
  title: 'Cardiology Phase III — Amlodipine Besylate',
  sponsor: 'NovaPharma Inc.',
  phase: 'PHASE_3',
  status: 'ACTIVE',
  conditionArea: 'Cardiology',
  interventionType: 'Drug',
  targetEnrollment: 300,
  plannedStart: '2025-11-01T00:00:00.000Z',
  plannedEnd: '2027-02-28T00:00:00.000Z',
  enrollmentProgress: 0.72,
  funnel: { screened: 280, enrolled: 216, active: 198, withdrawn: 18, screenFailed: 64 },
  aeSummary: { total: 45, serious: 8, unresolved: 3, byGrade: { MILD: 20, MODERATE: 15, SEVERE: 7, CRITICAL: 3 } },
  healthScore: 62,
  healthStatus: 'WATCH',
  flags: [
    { type: 'SERIOUS_UNRESOLVED', label: 'Serious Unresolved', reason: '3 serious AEs unresolved beyond 7-day review window (AE-007865, AE-007866, AE-007867)', sourceId: 'AE-007865' },
    { type: 'AE_RATE_ALERT', label: 'AE Rate Alert', reason: 'AE rate 18.2 per 100 patient-months exceeds threshold of 15' },
  ],
  sites: [
    { id: 'S-DEMO-001-01', siteName: 'Apollo Hospital, Delhi', region: 'North India', targetEnrollment: 100, activeSubjects: 72, enrolledSubjects: 78, screenFailed: 20, withdrawn: 6, activationDate: '2025-11-15T00:00:00.000Z', isNonEnrolling: false },
    { id: 'S-DEMO-001-02', siteName: 'KEM Hospital, Mumbai', region: 'West India', targetEnrollment: 100, activeSubjects: 68, enrolledSubjects: 74, screenFailed: 22, withdrawn: 6, activationDate: '2025-11-20T00:00:00.000Z', isNonEnrolling: false },
    { id: 'S-DEMO-001-03', siteName: 'CMC Vellore', region: 'South India', targetEnrollment: 100, activeSubjects: 58, enrolledSubjects: 64, screenFailed: 22, withdrawn: 6, activationDate: '2025-12-01T00:00:00.000Z', isNonEnrolling: false },
  ],
  adverseEvents: [
    {
      id: 'AE-007865', trialId: 'CT-DEMO-001', siteId: 'S-DEMO-001-01', subjectRef: 'SUBJ-DEMO-001-0042',
      onsetDate: '2026-08-10T00:00:00.000Z', resolvedDate: null,
      term: 'Severe Hypotension', symptoms: ['Hypotension', 'Dizziness', 'Syncope'],
      severityGrade: 'SEVERE', seriousFlag: true, outcome: 'Not yet resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 67, patientSex: 'Male', suspectedRelationship: 'Probable',
      riskLevelSeed: 'High', reviewPrioritySeed: 'Urgent',
      riskFactorsSeed: 'Elderly patient, pre-existing renal impairment, concomitant ACE inhibitor',
      staffRecommendationSeed: 'Immediate dose reduction; cardiology consult; increase monitoring frequency to q4h vitals',
      caseSummary: 'Elderly male patient developed severe hypotension 72h post dose escalation.',
      eventNarrative: 'Patient experienced symptomatic hypotension requiring IV fluid resuscitation.',
      aiRecommendation: null, aiGeneratedAt: null,
    },
    {
      id: 'AE-007866', trialId: 'CT-DEMO-001', siteId: 'S-DEMO-001-02', subjectRef: 'SUBJ-DEMO-001-0089',
      onsetDate: '2026-08-15T00:00:00.000Z', resolvedDate: null,
      term: 'Peripheral Edema', symptoms: ['Edema', 'Weight Gain', 'Fatigue'],
      severityGrade: 'MODERATE', seriousFlag: true, outcome: 'Not yet resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 55, patientSex: 'Female', suspectedRelationship: 'Possible',
      riskLevelSeed: 'Medium', reviewPrioritySeed: 'Standard',
      riskFactorsSeed: 'History of CHF, concurrent diuretic use',
      staffRecommendationSeed: 'Monitor weight daily; consider dose adjustment; assess cardiac function',
      caseSummary: 'Female patient with CHF history developed progressive peripheral edema.',
      eventNarrative: 'Bilateral lower extremity edema noted at Week 12 visit. 3kg weight gain over 2 weeks.',
      aiRecommendation: null, aiGeneratedAt: null,
    },
    {
      id: 'AE-007870', trialId: 'CT-DEMO-001', siteId: 'S-DEMO-001-03', subjectRef: 'SUBJ-DEMO-001-0112',
      onsetDate: '2026-07-20T00:00:00.000Z', resolvedDate: '2026-08-05T00:00:00.000Z',
      term: 'Headache', symptoms: ['Headache', 'Nausea'],
      severityGrade: 'MILD', seriousFlag: false, outcome: 'Resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 45, patientSex: 'Male', suspectedRelationship: 'Unlikely',
      riskLevelSeed: 'Low', reviewPrioritySeed: 'Routine',
      riskFactorsSeed: 'None identified',
      staffRecommendationSeed: 'Continue current dose; symptomatic management with acetaminophen',
      caseSummary: 'Mild headache following dose initiation, self-limited.',
      eventNarrative: 'Patient reported intermittent headache for 2 weeks following first dose. Resolved without intervention.',
      aiRecommendation: null, aiGeneratedAt: null,
    },
  ],
  milestones: [
    { id: 'M-DEMO-001-01', trialId: 'CT-DEMO-001', type: 'FPFV', plannedDate: '2025-12-01T00:00:00.000Z', actualDate: '2025-12-05T00:00:00.000Z', state: 'DONE', daysUntil: -271 },
    { id: 'M-DEMO-001-02', trialId: 'CT-DEMO-001', type: 'Interim Analysis', plannedDate: '2026-06-15T00:00:00.000Z', actualDate: '2026-06-20T00:00:00.000Z', state: 'DONE', daysUntil: -73 },
    { id: 'M-DEMO-001-03', trialId: 'CT-DEMO-001', type: 'DSMB Review', plannedDate: '2026-09-15T00:00:00.000Z', actualDate: null, state: 'DUE_SOON', daysUntil: 14 },
    { id: 'M-DEMO-001-04', trialId: 'CT-DEMO-001', type: 'LPLV', plannedDate: '2027-01-15T00:00:00.000Z', actualDate: null, state: 'FUTURE', daysUntil: 136 },
    { id: 'M-DEMO-001-05', trialId: 'CT-DEMO-001', type: 'DB Lock', plannedDate: '2027-02-28T00:00:00.000Z', actualDate: null, state: 'FUTURE', daysUntil: 180 },
  ],
  insight: null,
};

const FIXTURE_PORTFOLIO: PortfolioSummary = {
  totalTrials: 5,
  activeTrials: 3,
  totalSubjects: 645,
  enrolledSubjects: 838,
  totalAdverseEvents: 165,
  seriousAdverseEvents: 28,
  unresolvedEvents: 9,
  flaggedTrials: 3,
  avgHealthScore: 60,
  trialsByPhase: { PHASE_1: 1, PHASE_2: 2, PHASE_3: 1, PHASE_4: 1 },
  trialsByStatus: { RECRUITING: 2, ACTIVE: 2, PAUSED: 1, COMPLETED: 0 },
};

const FIXTURE_FLAGGED: FlaggedExportRow[] = [
  { trialId: 'CT-DEMO-001', title: 'Cardiology Phase III — Amlodipine Besylate', phase: 'PHASE_3', status: 'ACTIVE', healthScore: 62, healthStatus: 'WATCH', flagType: 'SERIOUS_UNRESOLVED', flagReason: '3 serious AEs unresolved beyond 7-day review window' },
  { trialId: 'CT-DEMO-001', title: 'Cardiology Phase III — Amlodipine Besylate', phase: 'PHASE_3', status: 'ACTIVE', healthScore: 62, healthStatus: 'WATCH', flagType: 'AE_RATE_ALERT', flagReason: 'AE rate 18.2 per 100 patient-months exceeds threshold of 15' },
  { trialId: 'CT-DEMO-002', title: 'Oncology Phase II — Pembrolizumab Combination', phase: 'PHASE_2', status: 'RECRUITING', healthScore: 48, healthStatus: 'WATCH', flagType: 'BEHIND_PLAN', flagReason: 'Enrollment at 45% vs expected 62% — shortfall of 34 subjects' },
  { trialId: 'CT-DEMO-002', title: 'Oncology Phase II — Pembrolizumab Combination', phase: 'PHASE_2', status: 'RECRUITING', healthScore: 48, healthStatus: 'WATCH', flagType: 'NON_ENROLLING_SITE', flagReason: 'Site S-DEMO-002-03 (Mumbai Central) has 0 enrollments after 52 days' },
  { trialId: 'CT-DEMO-004', title: 'Immunology Phase IV — Adalimumab Biosimilar', phase: 'PHASE_4', status: 'ACTIVE', healthScore: 35, healthStatus: 'CRITICAL', flagType: 'SERIOUS_UNRESOLVED', flagReason: '5 serious AEs unresolved beyond 7-day review window' },
  { trialId: 'CT-DEMO-004', title: 'Immunology Phase IV — Adalimumab Biosimilar', phase: 'PHASE_4', status: 'ACTIVE', healthScore: 35, healthStatus: 'CRITICAL', flagType: 'AE_RATE_ALERT', flagReason: 'AE rate 22.1 per 100 patient-months exceeds threshold of 15' },
  { trialId: 'CT-DEMO-004', title: 'Immunology Phase IV — Adalimumab Biosimilar', phase: 'PHASE_4', status: 'ACTIVE', healthScore: 35, healthStatus: 'CRITICAL', flagType: 'ENROLLMENT_STALLED', flagReason: 'No new enrollments in 21 days despite ACTIVE status' },
];

// ── Validate fixtures at module load ────────────────────────────────────────

trialsResponseSchema.parse(FIXTURE_TRIALS);
appConfigSchema.parse(FIXTURE_CONFIG);
portfolioSummarySchema.parse(FIXTURE_PORTFOLIO);
flaggedExportResponseSchema.parse(FIXTURE_FLAGGED);
// Trial detail validated separately (has more fields):
trialDetailSchema.parse(FIXTURE_TRIAL_DETAIL);

// ── Express app ─────────────────────────────────────────────────────────────

/**
 * Built separately from the listener so tests can mount the app with supertest
 * without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!isTest) app.use(morgan('dev'));

  // ── GET /api/health ─────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    const data: HealthCheck = {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      env: env.NODE_ENV,
      db: { connected: false },   // fixture mode — no DB yet
      ai: aiStatus(),
    };
    ok(res, data);
  });

  // ── GET /api/config ─────────────────────────────────────────────────────
  app.get('/api/config', (_req, res) => {
    ok(res, FIXTURE_CONFIG);
  });

  // ── GET /api/trials ─────────────────────────────────────────────────────
  app.get('/api/trials', (_req, res) => {
    // Sort by healthScore ascending (most critical first)
    const sorted = [...FIXTURE_TRIALS].sort((a, b) => a.healthScore - b.healthScore);
    ok(res, sorted);
  });

  // ── GET /api/trials/:id ─────────────────────────────────────────────────
  app.get('/api/trials/:id', (req, res) => {
    const { id } = req.params;
    // In fixture mode, only CT-DEMO-001 has full detail
    if (id === FIXTURE_TRIAL_DETAIL.id) {
      ok(res, FIXTURE_TRIAL_DETAIL);
    } else {
      // Check if the trial exists in the card list
      const card = FIXTURE_TRIALS.find((t) => t.id === id);
      if (!card) {
        res.status(404).json({ ok: false, error: { message: `Trial ${id} not found`, code: 'NOT_FOUND' } });
        return;
      }
      // Return a minimal detail from the card data
      const detail: TrialDetail = {
        ...card,
        plannedStart: '2025-11-01T00:00:00.000Z',
        plannedEnd: '2027-02-28T00:00:00.000Z',
        sites: [],
        adverseEvents: [],
        milestones: [],
        insight: null,
      };
      ok(res, detail);
    }
  });

  // ── GET /api/portfolio/summary ──────────────────────────────────────────
  app.get('/api/portfolio/summary', (_req, res) => {
    ok(res, FIXTURE_PORTFOLIO);
  });

  // ── POST /api/insights/refresh ──────────────────────────────────────────
  app.post('/api/insights/refresh', (_req, res) => {
    // Fixture mode — return a stubbed insight
    const insight: TrialInsight = {
      trialId: 'CT-DEMO-001',
      healthScore: 62,
      healthStatus: 'WATCH',
      scoreBreakdown: { enrollment: 18, aeRate: 12, severeMix: 15, milestone: 17 },
      aiSummary: null,
      source: 'fallback',
      generatedAt: new Date().toISOString(),
    };
    ok(res, { refreshed: 1, insights: [insight] });
  });

  // ── GET /api/export/flagged ─────────────────────────────────────────────
  app.get('/api/export/flagged', (_req, res) => {
    ok(res, FIXTURE_FLAGGED);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
