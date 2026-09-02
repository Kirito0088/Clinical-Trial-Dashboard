import { z } from 'zod';

export const portfolioSummarySchema = z.object({
  totalTrials: z.number().int(),
  activeTrials: z.number().int(),
  totalSubjects: z.number().int(),
  enrolledSubjects: z.number().int(),
  totalAdverseEvents: z.number().int(),
  seriousAdverseEvents: z.number().int(),
  unresolvedEvents: z.number().int(),
  flaggedTrials: z.number().int(),
  avgHealthScore: z.number(),
  trialsByPhase: z.object({
    PHASE_1: z.number().int(),
    PHASE_2: z.number().int(),
    PHASE_3: z.number().int(),
    PHASE_4: z.number().int(),
  }),
  trialsByStatus: z.object({
    RECRUITING: z.number().int(),
    ACTIVE: z.number().int(),
    PAUSED: z.number().int(),
    COMPLETED: z.number().int(),
  }),
});
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;
