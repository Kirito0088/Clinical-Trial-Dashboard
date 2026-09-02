import type { CreateItemInput, ListQuery, Stage, UpdateItemInput } from '@gvhax/shared';
import { ITEM_FILTERABLE, ITEM_SORTABLE } from '@gvhax/shared';
import { HttpError } from '../../lib/http.js';
import { listResource } from '../../lib/query.js';
import { transitionStage, type Actor } from '../workflow/workflow.service.js';
import { Item } from './item.model.js';

export const RESOURCE = 'items';

export function list(query: ListQuery & Record<string, unknown>) {
  return listResource(Item, query, {
    filterable: ITEM_FILTERABLE,
    sortable: ITEM_SORTABLE,
    searchable: ['title', 'description', 'tags'],
  });
}

export async function getById(id: string) {
  const doc = await Item.findById(id);
  if (!doc) throw HttpError.notFound('Item not found');
  return doc;
}

export function create(input: CreateItemInput, ownerId: string | null) {
  return Item.create({ ...input, ownerId, stageEnteredAt: new Date() });
}

export async function update(id: string, input: UpdateItemInput) {
  const doc = await Item.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!doc) throw HttpError.notFound('Item not found');
  return doc;
}

export async function remove(id: string) {
  const doc = await Item.findByIdAndDelete(id);
  if (!doc) throw HttpError.notFound('Item not found');
  return doc;
}

export async function moveStage(id: string, to: Stage, note: string | undefined, actor: Actor | null) {
  const doc = await getById(id);
  return transitionStage(doc, to, { resource: RESOURCE, note, actor });
}

export async function vote(id: string, delta: 1 | -1) {
  const doc = await Item.findByIdAndUpdate(id, { $inc: { votes: delta } }, { new: true });
  if (!doc) throw HttpError.notFound('Item not found');
  return doc;
}

export async function rate(id: string, score: number) {
  const doc = await Item.findByIdAndUpdate(
    id,
    { $inc: { ratingSum: score, ratingCount: 1 } },
    { new: true },
  );
  if (!doc) throw HttpError.notFound('Item not found');
  return doc;
}

/**
 * Pre-baked aggregations behind the dashboard. Every "show me a dashboard of
 * X" statement needs roughly these four shapes, so they ship ready-made.
 */
export async function stats() {
  const [byStage, byCategory, byPriority, totals, overdue, recent] = await Promise.all([
    Item.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
    Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    Item.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Item.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' }, avgAmount: { $avg: '$amount' } } },
    ]),
    Item.countDocuments({ slaBreached: true }),
    // Daily created-count for the last 30 days — the standard trend line.
    Item.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const bucket = (rows: { _id: unknown; count: number; amount?: number }[]) =>
    rows.map((r) => ({ key: String(r._id ?? 'unknown'), value: r.count, amount: r.amount ?? 0 }));

  return {
    byStage: bucket(byStage),
    byCategory: bucket(byCategory),
    byPriority: bucket(byPriority),
    trend: recent.map((r: { _id: string; count: number }) => ({ date: r._id, count: r.count })),
    totals: {
      count: totals[0]?.count ?? 0,
      amount: totals[0]?.amount ?? 0,
      avgAmount: Number((totals[0]?.avgAmount ?? 0).toFixed(2)),
      overdue,
    },
  };
}

/** Items that carry coordinates — feeds the Leaflet layer directly. */
export async function geo() {
  return Item.find({ 'location.lat': { $ne: null } })
    .select('title category stage priority amount location')
    .limit(1000)
    .lean();
}

/** Items with a date range — feeds the Gantt timeline directly. */
export async function timeline() {
  return Item.find({ startDate: { $ne: null }, dueDate: { $ne: null } })
    .select('title category stage startDate dueDate slaBreached')
    .sort({ startDate: 1 })
    .limit(300)
    .lean();
}
