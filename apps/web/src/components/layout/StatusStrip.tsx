import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSocketStatus } from '@/lib/socket';

interface Health {
  status: string;
  uptime: number;
  env: string;
  db: { tier: 'atlas' | 'local' | 'memory' | 'disconnected'; notes: string[] };
  ai: { configured: string; active: string; willDegrade: boolean; available: string[] };
  ml: { enabled: boolean; baseUrl: string };
}

type Tone = 'ok' | 'warn' | 'bad' | 'idle';

const DOT: Record<Tone, string> = {
  ok: 'bg-[var(--color-calm)]',
  warn: 'bg-[var(--color-warn)]',
  bad: 'bg-[var(--color-danger)]',
  idle: 'bg-[var(--muted)]',
};

/**
 * The signature element.
 *
 * Most dashboards hide infrastructure state. This kit's whole design thesis is
 * graceful degradation — three database tiers, an AI provider that silently
 * falls back to rule-based output — and degradation you cannot see is
 * indistinguishable from a bug. So the strip is always visible.
 *
 * It earns its place three ways: during the build you instantly see that Mongo
 * fell back to in-memory; during judging it stays honest about whether an
 * answer came from a real model or the offline responder; and it doubles as the
 * fastest possible smoke test.
 */
export function StatusStrip() {
  const socket = useSocketStatus();

  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<Health>('/health').then((r) => r.data),
    refetchInterval: 15_000,
    retry: false,
  });

  const { data: ml } = useQuery({
    queryKey: ['ml-health'],
    queryFn: () => api.get('/ml/health').then(() => true),
    refetchInterval: 30_000,
    retry: false,
    // A stopped sidecar is the normal state, not an error worth shouting about.
    throwOnError: false,
  });

  if (isError) {
    return (
      <Strip>
        <Pill tone="bad" label="api" value="unreachable" />
        <span className="text-[11px] text-[var(--muted)]">
          Start it with <code className="font-mono">npm run dev</code>
        </span>
      </Strip>
    );
  }

  if (!data) {
    return (
      <Strip>
        <Pill tone="idle" label="api" value="checking…" />
      </Strip>
    );
  }

  const dbTone: Tone =
    data.db.tier === 'disconnected' ? 'bad' : data.db.tier === 'memory' ? 'warn' : 'ok';
  const aiTone: Tone = data.ai.willDegrade ? 'warn' : data.ai.active === 'mock' ? 'idle' : 'ok';

  return (
    <Strip>
      <Pill
        tone={dbTone}
        label="db"
        value={data.db.tier}
        title={
          data.db.tier === 'memory'
            ? 'In-memory MongoDB — data is lost on restart. Run `npm run seed` to repopulate.'
            : data.db.notes.join(' · ') || `Connected to ${data.db.tier}`
        }
      />
      <Pill
        tone={aiTone}
        label="ai"
        value={data.ai.active}
        title={
          data.ai.willDegrade
            ? `${data.ai.configured} is configured but has no API key — responses come from the offline responder.`
            : data.ai.active === 'mock'
              ? 'Rule-based offline responder. Set AI_PROVIDER and a key in .env for a real model.'
              : `Live model via ${data.ai.active}`
        }
      />
      <Pill
        tone={ml ? 'ok' : 'idle'}
        label="ml"
        value={ml ? 'up' : 'off'}
        title={ml ? `Python sidecar at ${data.ml.baseUrl}` : 'Python sidecar not running — npm run dev:ml'}
      />
      <Pill
        tone={socket === 'connected' ? 'ok' : 'idle'}
        label="ws"
        value={socket}
        title="Socket.IO connection for live updates"
        pulse={socket === 'connected'}
      />
      <span className="ml-auto font-mono text-[11px] text-[var(--muted)]">
        {data.env} · up {formatUptime(data.uptime)}
      </span>
    </Strip>
  );
}

const Strip = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-1.5">
    {children}
  </div>
);

function Pill({
  tone,
  label,
  value,
  title,
  pulse,
}: {
  tone: Tone;
  label: string;
  value: string;
  title?: string;
  pulse?: boolean;
}) {
  return (
    <span
      title={title}
      className="inline-flex cursor-help items-center gap-1.5 rounded border border-[var(--border)] px-1.5 py-0.5"
    >
      <span className={cn('size-1.5 rounded-full', DOT[tone], pulse && 'pulse-dot')} />
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className="font-mono text-[11px] font-500">{value}</span>
    </span>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
