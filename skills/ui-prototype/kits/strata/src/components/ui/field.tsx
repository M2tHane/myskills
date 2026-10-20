import * as React from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldProps {
  label?: React.ReactNode;
  required?: boolean;
  /** Error message — only when validation fails. Fields carry no permanent helper text by design. */
  error?: React.ReactNode;
  htmlFor?: string;
  /** horizontal: label on the left, for settings pages. */
  orientation?: 'vertical' | 'horizontal';
  labelWidth?: number;
  /** Right end of the label row: a character count or a link. */
  aside?: React.ReactNode;
  /** Grid columns to span inside FormSection. */
  span?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Field({ label, required, error, htmlFor, orientation = 'vertical', labelWidth = 112, aside, span, className, children }: FieldProps) {
  const h = orientation === 'horizontal';
  return (
    <div
      data-invalid={error ? true : undefined}
      className={cn('flex min-w-0 flex-col gap-1.5 font-sans', h && 'grid items-start gap-x-4', className)}
      style={{ ...(h ? { gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` } : {}), ...(span ? { gridColumn: `span ${span}` } : {}) }}
    >
      {label != null && (
        <div className={cn('flex items-baseline justify-between gap-2', h && 'min-h-(--control-md) items-center')}>
          <label htmlFor={htmlFor} className="text-body-sm font-medium text-fg">
            {label}{required && <span aria-hidden="true" className="ml-[3px] font-semibold text-danger">*</span>}
          </label>
          {aside != null && !h && <span className="text-caption text-fg-subtle tabular-nums">{aside}</span>}
        </div>
      )}
      <div className={cn('flex min-w-0 flex-col gap-1.5', h && 'min-h-(--control-md) justify-center')}>
        {children}
        {error && <div role="alert" className="flex items-center gap-[5px] text-caption text-danger"><CircleAlert className="size-[13px] shrink-0" />{error}</div>}
      </div>
    </div>
  );
}

/** A titled group of fields on a grid. Sections are separated by a hairline. */
export function FormSection({ title, columns = 1, actions, className, children }: { title?: React.ReactNode; columns?: number; actions?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <section className={cn('flex flex-col gap-3.5 [&+&]:border-t [&+&]:border-border-subtle [&+&]:pt-5 [&+&]:mt-5', className)}>
      {title != null && (
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-body font-semibold text-fg">{title}</h3>
          {actions}
        </div>
      )}
      <div className="grid gap-x-4 gap-y-3.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{children}</div>
    </section>
  );
}

/** Form footer: auxiliary actions at the start, cancel + the single primary action at the end. */
export function FormActions({ start, className, children }: { start?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('flex w-full items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
