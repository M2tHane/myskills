import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CircleCheck, CircleX, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type Tone = 'info' | 'success' | 'warning' | 'danger';
export const toneIcon: Record<Tone, LucideIcon> = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleX };
const toneTile: Record<Tone, string> = {
  info: 'bg-info-soft border-info-line text-info',
  success: 'bg-success-soft border-success-line text-success',
  warning: 'bg-warning-soft border-warning-line text-warning',
  danger: 'bg-danger-soft border-danger-line text-danger',
};

export const overlayClass = 'fixed inset-0 z-[900] bg-scrim backdrop-blur-[2px] data-[state=open]:animate-fade-in';

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** sm 400: confirmations and single-field forms · md 520: 2–4 fields · lg 720: complex content. */
  size?: 'sm' | 'md' | 'lg';
}

/** L3 modal: scrim + blur, surface-raised, radius-lg, shadow-overlay. Esc / scrim / ✕ close it. */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent({ size = 'md', className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <div className="pointer-events-none fixed inset-0 z-[901] flex items-center justify-center p-6">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'pointer-events-auto flex max-h-full w-full flex-col rounded-lg border border-border-subtle bg-surface-raised font-sans shadow-overlay outline-none data-[state=open]:animate-rise-in',
            size === 'sm' ? 'max-w-[400px]' : size === 'lg' ? 'max-w-[720px]' : 'max-w-[520px]',
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
});

/** Title row. `tone` adds a tinted icon disc for confirmations; the body then aligns with the title. */
export function DialogHeader({ tone, className, children }: { tone?: Tone; className?: string; children?: React.ReactNode }) {
  const Icon = tone ? toneIcon[tone] : null;
  return (
    <div data-tone={tone} className={cn('group/dh flex items-center gap-3 pt-4 pr-4 pb-3 pl-5', className)}>
      {Icon && <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full border [&_svg]:size-[17px]', toneTile[tone!])}><Icon /></span>}
      <div className="min-w-0 flex-1">{children}</div>
      <DialogPrimitive.Close aria-label="关闭" className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-subtle outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-4">
        <X />
      </DialogPrimitive.Close>
    </div>
  );
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn('m-0 text-heading leading-6 font-semibold text-fg', className)} {...props} />;
});

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn('m-0 text-body-sm text-fg-muted', className)} {...props} />;
});

/** Body. Use `indent` under a toned header so the text aligns with the title. */
export function DialogBody({ indent, className, children }: { indent?: boolean; className?: string; children?: React.ReactNode }) {
  return <div className={cn('min-h-0 flex-1 overflow-auto px-5 pb-5 text-body-sm text-fg-muted', indent && 'pl-16', className)}>{children}</div>;
}

/** Sunken footer, buttons right-aligned, the primary action rightmost. Put a destructive entry at the start with <span className="flex-1" />. */
export function DialogFooter({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('flex items-center justify-end gap-2 rounded-b-lg border-t border-border-subtle bg-surface-sunken px-5 py-3', className)}>{children}</div>;
}
