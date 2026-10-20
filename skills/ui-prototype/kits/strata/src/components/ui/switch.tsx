import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: 'sm' | 'md';
  label?: React.ReactNode;
}

/** For settings that take effect immediately. Settings applied on submit use Checkbox. */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ size = 'md', label, className, id, disabled, ...props }, ref) {
  const auto = React.useId();
  const sid = id ?? auto;
  const sw = (
    <SwitchPrimitive.Root
      ref={ref}
      id={sid}
      disabled={disabled}
      className={cn(
        'peer relative shrink-0 cursor-pointer rounded-full border-0 bg-(--gray-200) p-0 shadow-inset outline-none transition-colors duration-150',
        size === 'sm' ? 'h-[15px] w-[26px]' : 'h-[18px] w-8',
        'hover:bg-(--gray-300) data-[state=checked]:bg-primary data-[state=checked]:shadow-primary focus-visible:shadow-focus-ring',
        'disabled:cursor-not-allowed disabled:bg-(--gray-150) disabled:shadow-none disabled:data-[state=checked]:bg-(--blue-200)',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'absolute top-0.5 left-0.5 block rounded-full bg-surface shadow-thumb transition-transform duration-150',
          size === 'sm' ? 'size-[11px] data-[state=checked]:translate-x-[11px]' : 'size-3.5 data-[state=checked]:translate-x-3.5',
        )}
      />
    </SwitchPrimitive.Root>
  );
  if (label == null) return sw;
  return (
    <span className="inline-flex items-center gap-2 align-top font-sans text-body-sm text-fg">
      {sw}
      <label htmlFor={sid} className="cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled">{label}</label>
    </span>
  );
});
