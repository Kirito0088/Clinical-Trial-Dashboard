/**
 * Clinical Trials Dashboard — formatting utilities.
 *
 * Plain number / percent / date / signed-days formatters for the dashboard UI.
 * No currency — this is clinical data, not finance.
 */

const nf = new Intl.NumberFormat('en-US');
const pf = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

/** 12345 → "12,345" */
export const formatNumber = (n: number | null | undefined): string =>
  n == null ? '—' : nf.format(n);

/** 0.723 → "72.3%" */
export const formatPercent = (n: number | null | undefined): string =>
  n == null ? '—' : pf.format(n);

/** +14 → "+14 days", -3 → "-3 days" (for milestone countdowns) */
export function formatSignedDays(days: number | null | undefined): string {
  if (days == null) return '—';
  if (days === 0) return 'Today';
  const abs = Math.abs(days);
  const label = abs === 1 ? 'day' : 'days';
  return days > 0 ? `+${abs} ${label}` : `−${abs} ${label}`;
}

/** 12345 -> "12.3k". For KPI tiles where width is tight. */
export function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const titleCase = (s: string): string =>
  s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
