import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-500 uppercase tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)]',
        signal: 'bg-[var(--color-signal-soft)] text-[var(--color-signal)]',
        calm: 'bg-[var(--color-calm-soft)] text-[var(--color-calm)]',
        warn: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
        danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);

/** Maps domain vocabulary to a tone, so colour stays consistent app-wide. */
export function toneForStage(stage: string): BadgeProps['tone'] {
  if (stage === 'approved' || stage === 'closed') return 'calm';
  if (stage === 'rejected') return 'danger';
  if (stage === 'in_review' || stage === 'submitted') return 'signal';
  return 'neutral';
}

export function toneForPriority(priority: string): BadgeProps['tone'] {
  if (priority === 'critical') return 'danger';
  if (priority === 'high') return 'warn';
  if (priority === 'medium') return 'signal';
  return 'neutral';
}
