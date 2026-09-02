import type { ColumnKind, ColumnProfile } from '@gvhax/shared';

type Row = Record<string, unknown>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]|$)|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;

/**
 * Infer what each column *is* from its values.
 *
 * This is what lets the dashboard auto-suggest sensible charts the moment a
 * CSV lands, instead of making someone hand-map columns under time pressure.
 * The "category" kind is the useful one: a low-cardinality string column is a
 * grouping axis, a high-cardinality one is free text.
 */
export function profileRows(rows: Row[]): ColumnProfile[] {
  if (rows.length === 0) return [];

  const names = [...new Set(rows.flatMap((r) => Object.keys(r)))];

  return names.map((name) => {
    const values = rows.map((r) => r[name]);
    const present = values.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - present.length;
    const strings = present.map((v) => String(v));
    const unique = new Set(strings);

    const kind = inferKind(present, unique.size, present.length);

    let min: number | null = null;
    let max: number | null = null;
    let mean: number | null = null;
    if (kind === 'number') {
      const nums = present.map(Number).filter(Number.isFinite);
      if (nums.length) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4));
      }
    }

    const counts = new Map<string, number>();
    for (const s of strings) counts.set(s, (counts.get(s) ?? 0) + 1);
    const topValues = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));

    return { name, kind, nullCount, uniqueCount: unique.size, min, max, mean, topValues };
  });
}

function inferKind(present: unknown[], uniqueCount: number, total: number): ColumnKind {
  if (present.length === 0) return 'string';

  const sample = present.slice(0, 200);
  const isBool = sample.every((v) => /^(true|false|yes|no|0|1)$/i.test(String(v)));
  if (isBool && uniqueCount <= 2) return 'boolean';

  const numeric = sample.filter((v) => String(v).trim() !== '' && Number.isFinite(Number(v)));
  if (numeric.length / sample.length > 0.9) return 'number';

  const dateish = sample.filter((v) => DATE_RE.test(String(v)) && !Number.isNaN(Date.parse(String(v))));
  if (dateish.length / sample.length > 0.8) return 'date';

  // A string column with few distinct values is a grouping dimension,
  // not free text — worth distinguishing, since it drives chart suggestions.
  if (uniqueCount <= Math.max(20, total * 0.05)) return 'category';
  return 'string';
}

/** Group-and-aggregate in memory. Mirrors what the charts need. */
export function aggregate(
  rows: Row[],
  opts: { groupBy: string; metric?: string; op: 'count' | 'sum' | 'avg' | 'min' | 'max' },
): { key: string; value: number; count: number }[] {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    const key = String(row[opts.groupBy] ?? 'unknown');
    const raw = opts.metric ? Number(row[opts.metric]) : 1;
    const value = Number.isFinite(raw) ? raw : 0;
    const list = buckets.get(key);
    if (list) list.push(value);
    else buckets.set(key, [value]);
  }

  return [...buckets.entries()].map(([key, values]) => ({
    key,
    count: values.length,
    value: reduce(values, opts.op),
  }));
}

function reduce(values: number[], op: 'count' | 'sum' | 'avg' | 'min' | 'max'): number {
  if (op === 'count') return values.length;
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  switch (op) {
    case 'sum':
      return Number(sum.toFixed(4));
    case 'avg':
      return Number((sum / values.length).toFixed(4));
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
  }
}
