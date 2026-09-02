import { z } from 'zod';
import { AE_SEVERITIES, HEALTH_STATUSES, MILESTONE_STATES, PHASES, TRIAL_STATUSES } from '../constants.js';
import { flagSchema } from './flag.js';

// ── Enrollment funnel (per trial or per site) ───────────────────────────────

export const enrollmentFunnelSchema = z.object({
  screened: z.number().int(),
  enrolled: z.number().int(),
  active: z.number().int(),
  withdrawn: z.number().int(),
  screenFailed: z.number().int(),
});
export type EnrollmentFunnel = z.infer<typeof enrollmentFunnelSchema>;

// ── AE summary (per trial) ─────────────────────────────────────────────────

export const aeSummarySchema = z.object({
  total: z.number().int(),
  serious: z.number().int(),
  unresolved: z.number().int(),
  byGrade: z.object({
    MILD: z.number().int(),
    MODERATE: z.number().int(),
    SEVERE: z.number().int(),
    CRITICAL: z.number().int(),
  }),
});
export type AeSummary = z.infer<typeof aeSummarySchema>;

// ── Next milestone (shown on card) ─────────────────────────────────────────

export const nextMilestoneSchema = z.object({
  id: z.string(),
  type: z.string(),
  plannedDate: z.string(),
  state: z.enum(MILESTONE_STATES),
  daysUntil: z.number().int(),
});
export type NextMilestone = z.infer<typeof nextMilestoneSchema>;

// ── Trial card (portfolio list) ─────────────────────────────────────────────

export const trialCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  sponsor: z.string(),
  phase: z.enum(PHASES),
  status: z.enum(TRIAL_STATUSES),
  conditionArea: z.string(),
  interventionType: z.string(),
  targetEnrollment: z.number().int(),
  enrollmentProgress: z.number(),        // 0–1 fraction
  funnel: enrollmentFunnelSchema,
  aeSummary: aeSummarySchema,
  nextMilestone: nextMilestoneSchema.nullable(),
  healthScore: z.number().int().min(0).max(100),
  healthStatus: z.enum(HEALTH_STATUSES),
  flags: z.array(flagSchema),
  flagCount: z.number().int(),
});
export type TrialCard = z.infer<typeof trialCardSchema>;

export const trialsResponseSchema = z.array(trialCardSchema);
export type TrialsResponse = z.infer<typeof trialsResponseSchema>;
