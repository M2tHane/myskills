import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> {
  checked?: boolean;
  /** Parent of a partially selected group. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  invalid?: boolean;
  label?: React.ReactNode;
}

/** Checked state uses the primary-button material: blue fill + top highlight. Label on the right. */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, indeterminate, onCheckedChange, invalid, label, disabled, className, id, ...props },
  ref,
) {
  const auto = React.useId();
  const cid = id ?? auto;
  const box = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={cid}
      disabled={disabled}
      checked={indeterminate ? 'indeterminate' : checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(c) => onCheckedChange?.(c === true)}
      aria-invalid={invalid || undefined}
      className={cn(
        'peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-border-strong bg-surface text-primary-fg shadow-xs outline-none',
        'transition-[background-color,border-color,box-shadow] duration-100 hover:border-(--gray-400) focus-visible:shadow-focus-ring',
        'data-[state=checked]:border-primary-hover data-[state=checked]:bg-primary data-[state=checked]:shadow-primary',
        'data-[state=indeterminate]:border-primary-hover data-[state=indeterminate]:bg-primary data-[state=indeterminate]:shadow-primary',
        invalid && 'border-danger',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:shadow-none',
        'disabled:data-[state=checked]:border-(--blue-200) disabled:data-[state=checked]:bg-(--blue-200)',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {indeterminate ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  if (label == null) return box;
  return (
    <span className="inline-flex items-center gap-2 align-top font-sans text-body-sm text-fg">
      {box}
      <label htmlFor={cid} className="cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled">{label}</label>
    </span>
  );
});
