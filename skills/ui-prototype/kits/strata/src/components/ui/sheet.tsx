import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export interface SheetContentProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  title: React.ReactNode;
  /** Status badge next to the title. */
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

/**
 * Right-hand panel for viewing or editing one record without leaving the list.
 * Floats 8px from the viewport edges; the scrim is light and not blurred so the list stays readable.
 */
export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(function SheetContent({ title, meta, footer, width = 480, className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[900] bg-scrim-soft data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        ref={ref}
        style={{ width }}
        className={cn(
          'fixed top-2 right-2 bottom-2 z-[901] flex max-w-[calc(100vw-16px)] flex-col rounded-lg border border-border-subtle bg-surface-raised font-sans shadow-overlay outline-none data-[state=open]:animate-slide-in-right',
          className,
        )}
        {...props}
      >
        <div className="flex min-h-14 items-center gap-3 border-b border-border-subtle py-3 pr-3 pl-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <DialogPrimitive.Title className="m-0 truncate text-heading leading-6 font-semibold text-fg">{title}</DialogPrimitive.Title>
            {meta}
          </div>
          <DialogPrimitive.Close aria-label="关闭" className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-subtle outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-4"><X /></DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">{typeof title === 'string' ? title : '详情'}</DialogPrimitive.Description>
        <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        {footer != null && <div className="flex items-center justify-end gap-2 rounded-b-lg border-t border-border-subtle bg-surface-sunken px-5 py-3">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
