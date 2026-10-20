import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps extends Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>, 'title'> {
  title?: React.ReactNode;
  /** Sunken footer: 重置 + 应用. */
  footer?: React.ReactNode;
  width?: number;
}

/** L2 card attached to a trigger, for a small group of controls (filters, quick settings). */
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent({ title, footer, width = 320, align = 'start', sideOffset = 4, className, children, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} collisionPadding={8} style={{ width }}
        className={cn('z-[950] flex flex-col rounded-md border border-border bg-surface-raised font-sans shadow-raised outline-none data-[state=open]:animate-pop-in', className)}
        {...props}>
        {title != null && <div className="px-3.5 pt-3 text-body-sm font-semibold text-fg">{title}</div>}
        <div className="px-3.5 pt-3 pb-3.5">{children}</div>
        {footer != null && <div className="flex items-center justify-end gap-2 rounded-b-md border-t border-border-subtle bg-surface-sunken px-3 py-2.5">{footer}</div>}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
