import { z } from 'zod';
import { PRIORITIES, STAGES } from '../constants.js';

/**
 * `Item` is the deliberately generic worked example that every part of the
 * kit is wired against — the table, the charts, the map, the pipeline board,
 * the audit log, the PDF report and the seeder all read this one shape.
 *
 * It carries one field of each *kind* on purpose:
 *   text (title/description)  -> search, RAG, similarity
 *   category/tags             -> grouping, filters, pie charts
 *   stage                     -> workflow state machine, kanban board
 *   priority                  -> colour coding
 *   amount                    -> numeric aggregation, bar/line charts
 *   startDate/dueDate         -> Gantt timeline, SLA breach detection
 *   location                  -> Leaflet markers / heat layer
 *   votes/rating              -> board & marketplace statements
 *   attachments               -> file upload / OCR statements
 *
 * When you draw a problem statement, either rename this wholesale or run
 * `npm run gen:feature` to stamp out a sibling with your real vocabulary.
 */

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().optional(),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

export const attachmentRefSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
});
export type AttachmentRef = z.infer<typeof attachmentRefSchema>;

/** What the client sends when creating. */
export const createItemSchema = z.object({
  title: z.string().trim().min(2, 'Title is too short').max(160),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().max(60).default('general'),
  stage: z.enum(STAGES).default('draft'),
  priority: z.enum(PRIORITIES).default('medium'),
  tags: z.array(z.string().trim().max(40)).max(20).default([]),
  amount: z.number().finite().default(0),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  location: geoPointSchema.optional(),
  attachments: z.array(attachmentRefSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

/** Partial update. Stage changes go through the workflow route, not this one. */
export const updateItemSchema = createItemSchema.partial().omit({ stage: true });
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** What the API returns. */
export const itemSchema = createItemSchema.extend({
  id: z.string(),
  ownerId: z.string().nullable(),
  votes: z.number().int(),
  rating: z.number().min(0).max(5),
  /** Set by the workflow service when the current stage exceeds its SLA. */
  slaBreached: z.boolean(),
  stageEnteredAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Item = z.infer<typeof itemSchema>;

/** Fields the list endpoint will filter on. Anything else in the query is ignored. */
export const ITEM_FILTERABLE = ['category', 'stage', 'priority', 'ownerId'] as const;
/** Fields the list endpoint will sort on. */
export const ITEM_SORTABLE = ['createdAt', 'updatedAt', 'title', 'amount', 'dueDate', 'votes', 'rating'] as const;
