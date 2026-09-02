import { z } from 'zod';
import { HEALTH_STATUSES } from '../constants.js';

export const scoreBreakdownSchema = z.object({
  enrollment: z.number(),
  aeRate: z.number(),
  severeMix: z.number(),
  milestone: z.number(),
});
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

export const trialInsightSchema = z.object({
  trialId: z.string(),
  healthScore: z.number().int().min(0).max(100),
  healthStatus: z.enum(HEALTH_STATUSES),
  scoreBreakdown: scoreBreakdownSchema,
  aiSummary: z.string().nullable(),
  source: z.enum(['gemini', 'fallback']),
  generatedAt: z.string(),
});
export type TrialInsight = z.infer<typeof trialInsightSchema>;
