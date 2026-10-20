import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DescriptionItem { label: React.ReactNode; value: React.ReactNode; span?: number; mono?: boolean }
export interface DescriptionListProps {
  items: DescriptionItem[];
  columns?: number;
  /** Many fields: label cells tinted like a table header, hairlines between cells. Few fields: leave plain. */
  bordered?: boolean;
  labelWidth?: number;
  className?: string;
}

/** Key–value details. Label left (fixed width), value right, so values start on one vertical line. */
export function DescriptionList({ items, columns = 2, bordered, labelWidth = 88, className }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'm-0 grid font-sans text-body-sm',
        bordered ? 'overflow-hidden rounded-md border border-border bg-surface' : 'gap-x-8 gap-y-3',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <div key={i}
          className={cn('grid min-w-0', bordered ? '-mr-px -mb-px items-stretch border-r border-b border-border-subtle' : 'items-baseline gap-x-3')}
          style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)`, ...(it.span ? { gridColumn: `span ${it.span}` } : {}) }}>
          <dt className={cn('whitespace-nowrap text-fg-muted', bordered && 'flex items-center border-r border-border-subtle bg-surface-sunken px-3 py-[9px] font-medium')}>{it.label}</dt>
          <dd className={cn('m-0 text-fg tabular-nums [overflow-wrap:anywhere]', bordered ? 'flex min-h-[38px] items-center px-3 py-[9px]' : 'font-medium',
            it.mono && 'font-mono text-code font-normal [font-variant-ligatures:none]')}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
