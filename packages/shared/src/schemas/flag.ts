import { z } from 'zod';
import { AE_SEVERITIES, FLAG_TYPES, HEALTH_STATUSES, MILESTONE_STATES, PHASES, TRIAL_STATUSES } from '../constants.js';

// ── Flag ────────────────────────────────────────────────────────────────────

export const flagSchema = z.object({
  type: z.enum(FLAG_TYPES),
  label: z.string(),
  reason: z.string(),
  /** Optional pointer to the source row the flag was derived from. */
  sourceId: z.string().optional(),
});
export type Flag = z.infer<typeof flagSchema>;
