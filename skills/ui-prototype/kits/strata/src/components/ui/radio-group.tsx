import * as React from 'react';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

export interface RadioOption { value: string; label: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }
export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  /** `card`: selectable tiles with an icon, for 2–6 options that read better with a picture. */
  variant?: 'default' | 'card';
  columns?: number;
  disabled?: boolean;
  className?: string;
}

const dot = cn(
  'relative size-4 shrink-0 cursor-pointer rounded-full border border-border-strong bg-surface shadow-xs outline-none',
  'transition-[background-color,border-color] duration-100 hover:border-(--gray-400) focus-visible:shadow-focus-ring',
  'data-[state=checked]:border-primary-hover data-[state=checked]:bg-primary data-[state=checked]:shadow-primary',
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:shadow-none',
  'disabled:data-[state=checked]:border-(--blue-200) disabled:data-[state=checked]:bg-(--blue-200)',
);

export function RadioGroup({ options, value, defaultValue, onValueChange, orientation = 'vertical', variant = 'default', columns, disabled, className }: RadioGroupProps) {
  const base = React.useId();
  const card = variant === 'card';
  return (
    <RadioPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      orientation={orientation}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      className={cn(
        orientation === 'horizontal' && !card ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid gap-2.5',
        className,
      )}
    >
      {options.map((o) => {
        const id = `${base}-${o.value}`;
        const item = (
          <RadioPrimitive.Item id={id} value={o.value} disabled={o.disabled} className={cn(dot, card && 'absolute top-1/2 right-3 -mt-2')}>
            <RadioPrimitive.Indicator className="absolute inset-1 rounded-full bg-primary-fg" />
          </RadioPrimitive.Item>
        );
        if (card) {
          return (
            <label key={o.value} htmlFor={id}
              className={cn(
                'group/rc relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md border border-border bg-surface py-3 pr-9 pl-3 font-sans text-body-sm shadow-card',
                'transition-[border-color,box-shadow,background-color] duration-100 hover:border-border-strong',
                'has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-surface-selected has-[[data-state=checked]]:shadow-[0_0_0_1px_var(--primary)]',
                'has-[:disabled]:cursor-not-allowed has-[:disabled]:text-fg-disabled',
              )}>
              {o.icon && (
                <span className={cn('inline-flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface-sunken text-fg-muted [&_svg]:size-[17px]',
                  'group-has-[[data-state=checked]]/rc:border-primary-line group-has-[[data-state=checked]]/rc:bg-surface group-has-[[data-state=checked]]/rc:text-primary')}>{o.icon}</span>
              )}
              <span className="min-w-0 truncate font-medium text-fg">{o.label}</span>
              {item}
            </label>
          );
        }
        return (
          <span key={o.value} className="inline-flex items-center gap-2 align-top font-sans text-body-sm text-fg">
            {item}
            <label htmlFor={id} className={cn('cursor-pointer select-none', (disabled || o.disabled) && 'cursor-not-allowed text-fg-disabled')}>{o.label}</label>
          </span>
        );
      })}
    </RadioPrimitive.Root>
  );
}
