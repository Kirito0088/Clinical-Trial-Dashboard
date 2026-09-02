import { z } from 'zod';

/** Inferred column kind, used to auto-suggest chart types and mappings. */
export const columnKindSchema = z.enum(['string', 'number', 'date', 'boolean', 'category']);
export type ColumnKind = z.infer<typeof columnKindSchema>;

export const columnProfileSchema = z.object({
  name: z.string(),
  kind: columnKindSchema,
  nullCount: z.number(),
  uniqueCount: z.number(),
  /** Present for numeric columns. */
  min: z.number().nullable(),
  max: z.number().nullable(),
  mean: z.number().nullable(),
  /** Up to 10 most common values — drives filter dropdowns. */
  topValues: z.array(z.object({ value: z.string(), count: z.number() })),
});
export type ColumnProfile = z.infer<typeof columnProfileSchema>;

export const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  rowCount: z.number(),
  columns: z.array(columnProfileSchema),
  createdAt: z.string(),
});
export type Dataset = z.infer<typeof datasetSchema>;

export const ingestRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  /** Already-parsed rows. Parsing happens client-side with papaparse. */
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(50000),
});
export type IngestRequest = z.infer<typeof ingestRequestSchema>;

/** Group-and-aggregate over a stored dataset — the engine behind every chart. */
export const aggregateRequestSchema = z.object({
  groupBy: z.string(),
  metric: z.string().optional(),
  op: z.enum(['count', 'sum', 'avg', 'min', 'max']).default('count'),
  limit: z.number().int().min(1).max(500).default(50),
  sort: z.enum(['key', 'value']).default('value'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export type AggregateRequest = z.infer<typeof aggregateRequestSchema>;

export const aggregateBucketSchema = z.object({
  key: z.string(),
  value: z.number(),
  count: z.number(),
});
export type AggregateBucket = z.infer<typeof aggregateBucketSchema>;
