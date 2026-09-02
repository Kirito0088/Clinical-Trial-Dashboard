import { z } from 'zod';
import { AE_SEVERITIES, HEALTH_STATUSES, MILESTONE_STATES, PHASES, TRIAL_STATUSES } from '../constants.js';
import { flagSchema } from './flag.js';
import { adverseEventSchema } from './adverse-event.js';
import { milestoneSchema } from './milestone.js';
import { siteEnrollmentSchema } from './site.js';
import { enrollmentFunnelSchema, aeSummarySchema } from './trial.js';
import { trialInsightSchema } from './insight.js';

/**
 * Trial detail — the full drill-down response for GET /api/trials/:id.
 */
export const trialDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  sponsor: z.string(),
  phase: z.enum(PHASES),
  status: z.enum(TRIAL_STATUSES),
  conditionArea: z.string(),
  interventionType: z.string(),
  targetEnrollment: z.number().int(),
  plannedStart: z.string(),
  plannedEnd: z.string(),
  enrollmentProgress: z.number(),
  funnel: enrollmentFunnelSchema,
  aeSummary: aeSummarySchema,
  healthScore: z.number().int().min(0).max(100),
  healthStatus: z.enum(HEALTH_STATUSES),
  flags: z.array(flagSchema),
  sites: z.array(siteEnrollmentSchema),
  adverseEvents: z.array(adverseEventSchema),
  milestones: z.array(milestoneSchema),
  insight: trialInsightSchema.nullable(),
});
export type TrialDetail = z.infer<typeof trialDetailSchema>;
