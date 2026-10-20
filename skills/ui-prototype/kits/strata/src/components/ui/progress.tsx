import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressProps { value?: number; max?: number; label?: React.ReactNode; showValue?: boolean; tone?: 'primary' | 'success' | 'danger'; size?: 'sm' | 'md'; indeterminate?: boolean; className?: string }

/** 6px sunken track, primary fill (success when done, danger on failure). sm 4px for list rows. */
export function Progress({ value = 0, max = 100, label, showValue = true, tone = 'primary', size = 'md', indeterminate, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-primary';
  return (
    <div className={cn('flex flex-col gap-1.5 font-sans', className)}>
      {(label != null || (showValue && !indeterminate)) && (
        <div className="flex items-baseline justify-between gap-3 text-body-sm">
          {label != null && <span className="truncate text-fg">{label}</span>}
          {showValue && !indeterminate && <span className="text-caption text-fg-muted tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={indeterminate ? undefined : value}
        className={cn('relative overflow-hidden rounded-full bg-surface-active shadow-inset', size === 'sm' ? 'h-1' : 'h-1.5')}>
        <div className={cn('h-full rounded-full shadow-fill-highlight transition-[width] duration-300', fill, indeterminate && 'absolute w-[36%] animate-indeterminate')}
          style={indeterminate ? undefined : { width: `${pct}%` }} />
      </div>
    </div>
  );
}

export interface StepsProps { items: { title: React.ReactNode }[]; current: number; className?: string }

/** Wizard steps: done = blue check, current = blue ring with a soft halo, todo = gray. 3–5 steps. */
export function Steps({ items, current, className }: StepsProps) {
  return (
    <ol className={cn('m-0 flex list-none items-center p-0 font-sans', className)}>
      {items.map((s, i) => {
        const st = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={i} aria-current={st === 'current' ? 'step' : undefined} className={cn('flex min-w-0 items-center gap-2', i < items.length - 1 ? 'flex-1' : 'flex-none')}>
            <span className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold tabular-nums',
              st === 'done' && 'border-primary-hover bg-primary text-primary-fg shadow-primary',
              st === 'current' && 'border-primary bg-surface text-primary shadow-[0_0_0_3px_var(--primary-soft-hover)]',
              st === 'todo' && 'border-border-strong bg-surface text-fg-subtle shadow-xs')}>
              {st === 'done' ? <Check className="size-[13px]" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('whitespace-nowrap text-body-sm font-medium', st === 'todo' ? 'text-fg-muted' : 'text-fg', st === 'current' && 'font-semibold')}>{s.title}</span>
            {i < items.length - 1 && <span aria-hidden="true" className={cn('mx-3 h-px min-w-6 flex-1', st === 'done' ? 'bg-primary' : 'bg-border-strong')} />}
          </li>
        );
      })}
    </ol>
  );
}
