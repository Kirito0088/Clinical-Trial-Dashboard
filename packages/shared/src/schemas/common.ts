import { z } from 'zod';

/**
 * Every list endpoint accepts this. Keep it uniform so the DataTable
 * component and the typed API client work against any resource.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.string().optional(),
  q: z.string().trim().optional(),
  filters: z.record(z.string(), z.string()).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Success envelope. */
export interface ApiOk<T> {
  ok: true;
  data: T;
  meta?: PageMeta | Record<string, unknown>;
}

/** Failure envelope. Thrown errors are normalised into this by the error middleware. */
export interface ApiErr {
  ok: false;
  error: {
    message: string;
    code: string;
    /** Field-level detail, populated for zod validation failures. */
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Shared timestamps every persisted document carries. */
export const timestampsSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
});
