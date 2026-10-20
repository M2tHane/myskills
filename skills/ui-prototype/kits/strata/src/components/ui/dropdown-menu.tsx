import * as React from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

/** L2 menu: surface-raised, border, radius-md, shadow-raised. Portalled; flips near edges. */
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Menu.Content>>(function DropdownMenuContent({ className, sideOffset = 4, align = 'start', ...props }, ref) {
  return (
    <Menu.Portal>
      <Menu.Content ref={ref} sideOffset={sideOffset} align={align} collisionPadding={8}
        className={cn('z-[950] flex min-w-45 flex-col rounded-md border border-border bg-surface-raised p-1 font-sans shadow-raised outline-none data-[state=open]:animate-pop-in', className)}
        {...props} />
    </Menu.Portal>
  );
});

const itemBase = 'relative flex h-8 cursor-pointer items-center gap-2 whitespace-nowrap rounded-sm px-2 text-body-sm text-fg outline-none select-none data-[highlighted]:bg-surface-hover data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled';

export interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof Menu.Item> {
  icon?: React.ReactNode;
  shortcut?: string;
  /** Destructive items go last, after a separator. */
  danger?: boolean;
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(function DropdownMenuItem({ icon, shortcut, danger, className, children, ...props }, ref) {
  return (
    <Menu.Item ref={ref} className={cn(itemBase, danger && 'text-danger data-[highlighted]:bg-danger-soft', className)} {...props}>
      {icon && <span className={cn('inline-flex w-4 shrink-0 justify-center text-fg-muted [&_svg]:size-[15px]', danger && 'text-danger', props.disabled && 'text-fg-disabled')}>{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {shortcut && <span className="ml-4 font-mono text-micro text-fg-subtle">{shortcut}</span>}
    </Menu.Item>
  );
});

/** Checkable option (column visibility, view options). Does not close the menu. */
export const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Menu.CheckboxItem>>(function DropdownMenuCheckboxItem({ className, children, onSelect, ...props }, ref) {
  return (
    <Menu.CheckboxItem ref={ref} className={cn(itemBase, className)} onSelect={(e) => { e.preventDefault(); onSelect?.(e); }} {...props}>
      <span className="inline-flex w-4 shrink-0 justify-center text-primary"><Menu.ItemIndicator><Check className="size-[15px]" strokeWidth={2.5} /></Menu.ItemIndicator></span>
      <span className="min-w-0 flex-1">{children}</span>
    </Menu.CheckboxItem>
  );
});

export function DropdownMenuLabel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Menu.Label className={cn('px-2 pt-1.5 pb-1 text-micro font-medium text-fg-subtle', className)}>{children}</Menu.Label>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border-subtle', className)} />;
}
