import { Router } from 'express';
import { aggregateRequestSchema, ingestRequestSchema, listQuerySchema } from '@gvhax/shared';
import { validate } from '../../middleware/validate.js';
import { attachUser } from '../../middleware/auth.js';
import { HttpError, ok, paginated, wrap } from '../../lib/http.js';
import { listResource } from '../../lib/query.js';
import { Dataset } from './dataset.model.js';
import { aggregate, profileRows } from './profile.js';

export const ingestRouter: Router = Router();
ingestRouter.use(attachUser);

/**
 * Store a parsed CSV and profile it in one hop.
 *
 * Parsing happens client-side (papaparse) so a 20MB file never crosses the
 * wire as a multipart upload and the user sees a preview instantly. The server
 * profiles and persists, which is what makes the data survive a page reload.
 */
ingestRouter.post(
  '/',
  validate(ingestRequestSchema),
  wrap(async (req, res) => {
    const { name, rows } = req.body;
    const columns = profileRows(rows);
    const doc = await Dataset.create({
      name,
      rows,
      columns,
      rowCount: rows.length,
      ownerId: req.user?.id ?? null,
    });
    res.status(201);
    ok(res, { id: String(doc._id), name, rowCount: rows.length, columns });
  }),
);

ingestRouter.get(
  '/',
  validate(listQuerySchema.passthrough(), 'query'),
  wrap(async (req, res) => {
    const { items, meta } = await listResource(Dataset, req.query as never, {
      filterable: ['ownerId'],
      sortable: ['createdAt', 'name', 'rowCount'],
      searchable: ['name'],
    });
    paginated(res, items, meta);
  }),
);

ingestRouter.get(
  '/:id',
  wrap(async (req, res) => {
    const doc = await Dataset.findById(req.params.id);
    if (!doc) throw HttpError.notFound('Dataset not found');
    ok(res, doc.toJSON());
  }),
);

/** Paged raw rows — feeds the DataTable without shipping the whole file. */
ingestRouter.get(
  '/:id/rows',
  validate(listQuerySchema.passthrough(), 'query'),
  wrap(async (req, res) => {
    const doc = await Dataset.findById(req.params.id).select('+rows');
    if (!doc) throw HttpError.notFound('Dataset not found');

    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const rows = (doc.rows ?? []) as Record<string, unknown>[];
    const start = (page - 1) * limit;

    paginated(res, rows.slice(start, start + limit), {
      page,
      limit,
      total: rows.length,
      pages: Math.max(1, Math.ceil(rows.length / limit)),
    });
  }),
);

/** Group-and-aggregate — the single endpoint behind every chart on a dataset. */
ingestRouter.post(
  '/:id/aggregate',
  validate(aggregateRequestSchema),
  wrap(async (req, res) => {
    const doc = await Dataset.findById(req.params.id).select('+rows');
    if (!doc) throw HttpError.notFound('Dataset not found');

    const { groupBy, metric, op, limit, sort, direction } = req.body;
    let buckets = aggregate((doc.rows ?? []) as Record<string, unknown>[], { groupBy, metric, op });

    const dir = direction === 'asc' ? 1 : -1;
    buckets.sort((a, b) =>
      sort === 'key' ? a.key.localeCompare(b.key) * dir : (a.value - b.value) * dir,
    );
    buckets = buckets.slice(0, limit);

    ok(res, buckets);
  }),
);

ingestRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    await Dataset.findByIdAndDelete(req.params.id);
    ok(res, { id: req.params.id });
  }),
);
