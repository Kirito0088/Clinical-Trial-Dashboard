import { z } from 'zod';
import { MILESTONE_STATES } from '../constants.js';

export const milestoneSchema = z.object({
  id: z.string(),
  trialId: z.string(),
  type: z.string(),
  plannedDate: z.string(),
  actualDate: z.string().nullable(),
  state: z.enum(MILESTONE_STATES),
  daysUntil: z.number().int(),      // negative = overdue
});
export type Milestone = z.infer<typeof milestoneSchema>;
