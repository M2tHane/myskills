import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  title?: React.ReactNode;
  /** Right side of the header: SegmentedControl, IconButton, a small button. */
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  /** `none` for lists and tables that run edge to edge. */
  padding?: 'default' | 'none';
  className?: string;
  children?: React.ReactNode;
}

/** L1 surface: white, border, shadow-card, radius-md. */
export function Card({ title, extra, footer, padding = 'default', className, children }: CardProps) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-md border border-border bg-surface font-sans shadow-card', className)}>
      {(title != null || extra != null) && (
        <header className="flex min-h-13 items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5">
          <h3 className="m-0 text-title-3 font-semibold text-fg">{title}</h3>
          {extra != null && <div className="flex items-center gap-2">{extra}</div>}
        </header>
      )}
      <div className={cn(padding === 'default' && 'p-4')}>{children}</div>
      {footer != null && (
        <footer className="flex min-h-11 items-center justify-between rounded-b-md border-t border-border-subtle bg-surface-sunken px-4 py-2 text-body-sm text-fg-muted">{footer}</footer>
      )}
    </section>
  );
}
