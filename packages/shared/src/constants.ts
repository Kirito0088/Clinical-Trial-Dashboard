/**
 * Clinical Trials Dashboard — domain enums.
 *
 * These are the single source of truth shared by api, web, and Prisma.
 * Prisma mirrors these as DB enums; the zod schemas reference them.
 */

// ── Trial phase ─────────────────────────────────────────────────────────────

export const PHASES = ['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4'] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  PHASE_1: 'Phase I',
  PHASE_2: 'Phase II',
  PHASE_3: 'Phase III',
  PHASE_4: 'Phase IV',
};

// ── Trial status ────────────────────────────────────────────────────────────

export const TRIAL_STATUSES = ['RECRUITING', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;
export type TrialStatus = (typeof TRIAL_STATUSES)[number];

// ── Adverse event severity ──────────────────────────────────────────────────

export const AE_SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'] as const;
export type AeSeverity = (typeof AE_SEVERITIES)[number];

// ── Milestone state (computed, not stored) ──────────────────────────────────

export const MILESTONE_STATES = ['DONE', 'OVERDUE', 'DUE_SOON', 'FUTURE'] as const;
export type MilestoneState = (typeof MILESTONE_STATES)[number];

// ── Health status (computed from health_score) ──────────────────────────────

export const HEALTH_STATUSES = ['HEALTHY', 'WATCH', 'CRITICAL'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

/** Healthy ≥ 70, Watch 40–69, Critical < 40 */
export const HEALTH_THRESHOLDS = { HEALTHY: 70, WATCH: 40 } as const;

// ── Flag types (deterministic rules from the PRD) ───────────────────────────

export const FLAG_TYPES = [
  'BEHIND_PLAN',
  'AE_RATE_ALERT',
  'SERIOUS_UNRESOLVED',
  'NON_ENROLLING_SITE',
  'ENROLLMENT_STALLED',
  'OVERDUE_MILESTONE',
] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

export const FLAG_LABELS: Record<FlagType, string> = {
  BEHIND_PLAN: 'Behind Plan',
  AE_RATE_ALERT: 'AE Rate Alert',
  SERIOUS_UNRESOLVED: 'Serious Unresolved',
  NON_ENROLLING_SITE: 'Non-Enrolling Site',
  ENROLLMENT_STALLED: 'Enrollment Stalled',
  OVERDUE_MILESTONE: 'Overdue Milestone',
};

// ── Intervention types ──────────────────────────────────────────────────────

export const INTERVENTION_TYPES = ['Drug', 'Vaccine', 'Device', 'Biologic'] as const;
export type InterventionType = (typeof INTERVENTION_TYPES)[number];
