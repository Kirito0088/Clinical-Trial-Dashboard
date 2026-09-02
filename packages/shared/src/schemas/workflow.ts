import { z } from 'zod';
import { STAGES } from '../constants.js';

export const transitionSchema = z.object({
  to: z.enum(STAGES),
  note: z.string().trim().max(500).optional(),
});
export type TransitionInput = z.infer<typeof transitionSchema>;

export const transitionRecordSchema = z.object({
  id: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  from: z.enum(STAGES).nullable(),
  to: z.enum(STAGES),
  note: z.string().optional(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  /** Hours spent in the previous stage. Null on the first transition. */
  dwellHours: z.number().nullable(),
  breachedSla: z.boolean(),
  createdAt: z.string(),
});
export type TransitionRecord = z.infer<typeof transitionRecordSchema>;

export const auditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  actorRole: z.string().nullable(),
  method: z.string(),
  path: z.string(),
  statusCode: z.number(),
  ip: z.string().nullable(),
  /** Shallow diff of what changed, when the route reports one. */
  changes: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;
