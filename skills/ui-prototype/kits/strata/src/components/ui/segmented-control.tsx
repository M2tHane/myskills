import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption { value: string; label?: React.ReactNode; icon?: React.ReactNode; ariaLabel?: string }
export interface SegmentedControlProps {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * SegmentedControl — switches how one block of data is shown (表格 / 图表, 日 / 周 / 月).
 * Sunken track + raised white chip. 2–5 options; use Tabs for page sections.
 */
export function SegmentedControl({ options, value, defaultValue, onValueChange, size = 'md', className }: SegmentedControlProps) {
  const [inner, setInner] = React.useState(defaultValue ?? options[0]?.value);
  const cur = value ?? inner;
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-stretch gap-0.5 rounded-md bg-surface-active p-0.5 shadow-inset',
        size === 'sm' ? 'h-(--control-sm)' : 'h-(--control-md)',
        className,
      )}
    >
      {options.map((o) => {
        const on = cur === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            onClick={() => { setInner(o.value); onValueChange?.(o.value); }}
            className={cn(
              'inline-flex min-w-7 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-sm font-medium outline-none',
              'transition-[background-color,color,box-shadow] duration-100 [&_svg]:size-[15px] [&_svg]:shrink-0',
              size === 'sm' ? 'px-2 text-caption' : 'px-3 text-body-sm',
              on
                ? 'bg-surface text-fg shadow-[var(--shadow-control),var(--shadow-ring-subtle)] [&_svg]:text-primary'
                : 'text-fg-muted hover:text-fg',
              'focus-visible:shadow-focus-ring',
            )}
          >
            {o.icon}
            {o.label != null && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
