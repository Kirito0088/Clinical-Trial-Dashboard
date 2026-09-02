/**
 * A tiny declarative rule engine.
 *
 * Several Computer-track statements are, underneath, "check this record
 * against a checklist and produce a pass/fail report": packaged-commodity
 * compliance (PS 23), floor-plan constraints (PS 07), inspection/violation
 * dashboards (PS 20), instrument verification (PS 25). Rather than writing
 * bespoke if-chains under time pressure, declare rules as data.
 *
 * Pure and dependency-free, so it runs identically in the browser and Node.
 */

export type Severity = 'info' | 'warning' | 'error';

export interface Rule<T = Record<string, unknown>> {
  id: string;
  /** Human-readable statement of what must be true. Shown in the report. */
  description: string;
  severity: Severity;
  /** Return true when the record SATISFIES the rule. */
  test: (record: T) => boolean;
  /** Optional guidance rendered when the rule fails. */
  remedy?: string;
}

export interface RuleResult {
  id: string;
  description: string;
  severity: Severity;
  passed: boolean;
  remedy?: string;
  /** Set when `test` threw — a broken rule must not fail the whole run. */
  error?: string;
}

export interface RuleReport {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  /** Failures that are `severity: 'error'`. These are what make `passed` false. */
  errorCount: number;
  warningCount: number;
  score: number; // 0-100, share of rules passed
  results: RuleResult[];
}

export function runRules<T>(record: T, rules: Rule<T>[]): RuleReport {
  const results: RuleResult[] = rules.map((rule) => {
    try {
      return {
        id: rule.id,
        description: rule.description,
        severity: rule.severity,
        passed: Boolean(rule.test(record)),
        remedy: rule.remedy,
      };
    } catch (err) {
      // A rule that throws counts as failed, but never takes the run down.
      return {
        id: rule.id,
        description: rule.description,
        severity: rule.severity,
        passed: false,
        remedy: rule.remedy,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const failed = results.filter((r) => !r.passed);
  const errorCount = failed.filter((r) => r.severity === 'error').length;
  const warningCount = failed.filter((r) => r.severity === 'warning').length;
  const passedCount = results.length - failed.length;

  return {
    passed: errorCount === 0,
    total: results.length,
    passedCount,
    failedCount: failed.length,
    errorCount,
    warningCount,
    score: results.length === 0 ? 100 : Math.round((passedCount / results.length) * 100),
    results,
  };
}

// ── Composable predicates ────────────────────────────────────────────────
// Building blocks so a rule set reads like a spec rather than like code.

export const required = (field: string) => (r: Record<string, unknown>) =>
  r[field] !== undefined && r[field] !== null && String(r[field]).trim() !== '';

export const isNumber = (field: string) => (r: Record<string, unknown>) =>
  typeof r[field] === 'number' ? Number.isFinite(r[field] as number) : !Number.isNaN(Number(r[field]));

export const between = (field: string, min: number, max: number) => (r: Record<string, unknown>) => {
  const n = Number(r[field]);
  return Number.isFinite(n) && n >= min && n <= max;
};

export const matches = (field: string, re: RegExp) => (r: Record<string, unknown>) =>
  re.test(String(r[field] ?? ''));

export const oneOf = (field: string, allowed: readonly string[]) => (r: Record<string, unknown>) =>
  allowed.includes(String(r[field] ?? ''));

export const maxLength = (field: string, n: number) => (r: Record<string, unknown>) =>
  String(r[field] ?? '').length <= n;

/** Example rule set. Replace wholesale once you know the real checklist. */
export const EXAMPLE_RULES: Rule<Record<string, unknown>>[] = [
  {
    id: 'has-title',
    description: 'Record must have a title',
    severity: 'error',
    test: required('title'),
    remedy: 'Fill in the title field.',
  },
  {
    id: 'amount-non-negative',
    description: 'Amount must be zero or greater',
    severity: 'error',
    test: (r) => Number(r.amount ?? 0) >= 0,
    remedy: 'Correct the amount to a non-negative value.',
  },
  {
    id: 'has-category',
    description: 'Record should be categorised',
    severity: 'warning',
    test: required('category'),
    remedy: 'Pick a category so the record appears in grouped reports.',
  },
];
