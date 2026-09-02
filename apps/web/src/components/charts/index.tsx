import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, compact, num } from '@/lib/utils';

/**
 * Thin Recharts wrappers with the theming already applied.
 *
 * The point is that a chart is one line at the call site — under a 3-hour
 * clock you should never be configuring axes. Every chart reads the same
 * `{ key, value }` bucket shape the API's aggregate endpoints return, so
 * piping data in requires no mapping.
 */

/** Series palette. Signal first so single-series charts get the accent. */
export const SERIES = [
  'var(--color-signal)',
  'var(--color-calm)',
  '#6366f1',
  '#b45309',
  '#0891b2',
  '#9333ea',
  '#65a30d',
  '#be123c',
] as const;

export interface Bucket {
  key: string;
  value: number;
  count?: number;
}

const AXIS = {
  stroke: 'var(--muted)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  tickLine: false,
} as const;

const GRID = <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />;

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ fill: 'var(--bg)', opacity: 0.6 }}
      contentStyle={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        color: 'var(--fg)',
      }}
      formatter={(v: number | string) => (typeof v === 'number' ? num(v) : v)}
    />
  );
}

const Frame = ({ height, children }: { height: number; children: React.ReactElement }) => (
  <ResponsiveContainer width="100%" height={height}>
    {children}
  </ResponsiveContainer>
);

export function BarChartCard({ data, height = 260 }: { data: Bucket[]; height?: number }) {
  return (
    <Frame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        {GRID}
        <XAxis dataKey="key" {...AXIS} interval="preserveStartEnd" />
        <YAxis {...AXIS} tickFormatter={compact} width={48} />
        <ChartTooltip />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES[i % SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function LineChartCard({
  data,
  xKey = 'date',
  yKey = 'count',
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  height?: number;
}) {
  return (
    <Frame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        {GRID}
        <XAxis dataKey={xKey} {...AXIS} minTickGap={24} />
        <YAxis {...AXIS} tickFormatter={compact} width={48} />
        <ChartTooltip />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke="var(--color-signal)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </Frame>
  );
}

export function AreaChartCard({
  data,
  xKey = 'at',
  yKey = 'value',
  height = 220,
}: {
  data: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  height?: number;
}) {
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {GRID}
        <XAxis dataKey={xKey} {...AXIS} tickFormatter={(v: string) => String(v).slice(11, 19)} minTickGap={40} />
        <YAxis {...AXIS} tickFormatter={compact} width={48} />
        <ChartTooltip />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke="var(--color-signal)"
          strokeWidth={2}
          fill="url(#areaFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </Frame>
  );
}

export function PieChartCard({ data, height = 260 }: { data: Bucket[]; height?: number }) {
  return (
    <Frame height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="52%" outerRadius="80%" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES[i % SERIES.length]} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
        <ChartTooltip />
        <Legend
          verticalAlign="bottom"
          height={28}
          formatter={(v: string) => <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v}</span>}
        />
      </PieChart>
    </Frame>
  );
}

export function ScatterChartCard({
  data,
  xKey = 'x',
  yKey = 'y',
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  height?: number;
}) {
  return (
    <Frame height={height}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        {GRID}
        <XAxis dataKey={xKey} type="number" {...AXIS} tickFormatter={compact} />
        <YAxis dataKey={yKey} type="number" {...AXIS} tickFormatter={compact} width={48} />
        <ChartTooltip />
        <Scatter data={data} fill="var(--color-signal)" fillOpacity={0.6} />
      </ScatterChart>
    </Frame>
  );
}

/**
 * Categorical heatmap — a grid of coloured cells.
 *
 * Recharts has no heatmap, and the skill-gap / regional-comparison statements
 * ask for one. CSS grid is genuinely the better tool here.
 */
export function Heatmap({
  rows,
  cols,
  values,
  height = 260,
}: {
  rows: string[];
  cols: string[];
  /** values[rowIndex][colIndex] */
  values: number[][];
  height?: number;
}) {
  const flat = values.flat();
  const max = Math.max(...flat, 1);

  return (
    <div className="overflow-x-auto" style={{ maxHeight: height }}>
      <div
        className="grid gap-px text-[11px]"
        style={{ gridTemplateColumns: `minmax(90px,auto) repeat(${cols.length}, minmax(52px,1fr))` }}
      >
        <div />
        {cols.map((c) => (
          <div key={c} className="truncate px-1 pb-1 text-center font-mono text-[10px] text-[var(--muted)]" title={c}>
            {c}
          </div>
        ))}

        {rows.map((r, ri) => (
          <>
            <div key={`${r}-label`} className="truncate py-1 pr-2 font-mono text-[10px] text-[var(--muted)]" title={r}>
              {r}
            </div>
            {cols.map((c, ci) => {
              const v = values[ri]?.[ci] ?? 0;
              const intensity = v / max;
              return (
                <div
                  key={`${r}-${c}`}
                  title={`${r} · ${c}: ${num(v)}`}
                  className="grid place-items-center rounded-[2px] py-1.5 tnum"
                  style={{
                    background: `color-mix(in srgb, var(--color-signal) ${Math.round(intensity * 100)}%, var(--card))`,
                    color: intensity > 0.55 ? 'white' : 'var(--fg)',
                  }}
                >
                  {v === 0 ? '' : compact(v)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

export interface GanttTask {
  id: string;
  title: string;
  startDate: string | Date;
  dueDate: string | Date;
  /** Renders the bar in the danger colour. */
  late?: boolean;
}

/**
 * Gantt-style timeline for the "planned vs actual milestone" statements.
 *
 * Bars are positioned as percentages of the overall window, so it needs no
 * charting library and scales to any date range.
 */
export function GanttTimeline({ tasks, height = 300 }: { tasks: GanttTask[]; height?: number }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--muted)]">No dated records to plot.</p>;
  }

  const starts = tasks.map((t) => new Date(t.startDate).getTime());
  const ends = tasks.map((t) => new Date(t.dueDate).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = Math.max(max - min, 1);

  return (
    <div className="overflow-y-auto pr-1" style={{ maxHeight: height }}>
      <div className="space-y-1.5">
        {tasks.map((t) => {
          const left = ((new Date(t.startDate).getTime() - min) / span) * 100;
          const width = Math.max(((new Date(t.dueDate).getTime() - new Date(t.startDate).getTime()) / span) * 100, 1.5);
          return (
            <div key={t.id} className="grid grid-cols-[minmax(120px,1fr)_3fr] items-center gap-3">
              <span className="truncate text-xs" title={t.title}>
                {t.title}
              </span>
              <div className="relative h-5 rounded bg-[var(--bg)]">
                <div
                  className={cn(
                    'absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full',
                    t.late ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-signal)]',
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${new Date(t.startDate).toLocaleDateString()} → ${new Date(t.dueDate).toLocaleDateString()}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** KPI tile. The big-number-with-label unit used across every dashboard. */
export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'signal' | 'calm' | 'danger';
}) {
  const color =
    tone === 'signal'
      ? 'text-[var(--color-signal)]'
      : tone === 'calm'
        ? 'text-[var(--color-calm)]'
        : tone === 'danger'
          ? 'text-[var(--color-danger)]'
          : '';

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={cn('mt-1 font-display text-2xl font-600 tabular-nums', color)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-[var(--muted)]">{hint}</div>}
    </div>
  );
}
