import type { FilterQuery, Model, SortOrder } from 'mongoose';
import type { ListQuery, PageMeta } from '@gvhax/shared';

export interface ListOptions<T> {
  /** Fields the client is permitted to filter by, via ?field=value. */
  filterable: readonly string[];
  /** Fields the client is permitted to sort by, via ?sort=-field. */
  sortable: readonly string[];
  /** Fields a free-text ?q= search scans, case-insensitively. */
  searchable: readonly string[];
  /** Always-applied constraints, e.g. scoping to the current user. */
  baseFilter?: FilterQuery<T>;
  defaultSort?: string;
}

/**
 * Turns a validated `ListQuery` into a paginated result.
 *
 * Every list endpoint in the app goes through this, which is what lets the
 * `DataTable` component work against any resource without per-resource code.
 * Filter and sort fields are allow-listed rather than passed through, so a
 * crafted query string can't reach into fields the route never meant to expose.
 */
export async function listResource<T>(
  model: Model<T>,
  query: ListQuery & Record<string, unknown>,
  opts: ListOptions<T>,
): Promise<{ items: T[]; meta: PageMeta }> {
  const { page, limit } = query;
  const filter: Record<string, unknown> = { ...(opts.baseFilter ?? {}) };

  // Equality filters straight off the query string.
  for (const field of opts.filterable) {
    const raw = query[field];
    if (raw === undefined || raw === '' || raw === null) continue;
    // Comma-separated values become an $in, so ?stage=draft,submitted works.
    const value = String(raw);
    filter[field] = value.includes(',') ? { $in: value.split(',').map((s) => s.trim()) } : value;
  }

  // Free-text search across the declared fields.
  if (query.q && opts.searchable.length > 0) {
    const re = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = opts.searchable.map((f) => ({ [f]: re }));
  }

  const sort = buildSort(query.sort, opts.sortable, opts.defaultSort ?? '-createdAt');

  const [items, total] = await Promise.all([
    model
      .find(filter as FilterQuery<T>)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<T[]>()
      .exec(),
    model.countDocuments(filter as FilterQuery<T>).exec(),
  ]);

  return {
    items,
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

function buildSort(
  raw: string | undefined,
  allowed: readonly string[],
  fallback: string,
): Record<string, SortOrder> {
  const spec = raw && allowed.includes(raw.replace(/^-/, '')) ? raw : fallback;
  const desc = spec.startsWith('-');
  return { [desc ? spec.slice(1) : spec]: desc ? -1 : 1 };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mongoose `toJSON` transform applied to every schema: exposes `id`, drops
 * `_id`/`__v`, and stringifies dates. Keeps the wire format identical to the
 * zod schemas in @gvhax/shared.
 */
export const jsonTransform = {
  virtuals: true,
  versionKey: false,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.password;
    return ret;
  },
};
