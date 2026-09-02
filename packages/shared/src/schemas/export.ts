import { z } from 'zod';
import { PHASES, TRIAL_STATUSES, FLAG_TYPES, HEALTH_STATUSES } from '../constants.js';

/** One row in the GET /api/export/flagged CSV export. */
export const flaggedExportRowSchema = z.object({
  trialId: z.string(),
  title: z.string(),
  phase: z.enum(PHASES),
  status: z.enum(TRIAL_STATUSES),
  healthScore: z.number().int(),
  healthStatus: z.enum(HEALTH_STATUSES),
  flagType: z.enum(FLAG_TYPES),
  flagReason: z.string(),
});
export type FlaggedExportRow = z.infer<typeof flaggedExportRowSchema>;

export const flaggedExportResponseSchema = z.array(flaggedExportRowSchema);
export type FlaggedExportResponse = z.infer<typeof flaggedExportResponseSchema>;
