import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

/**
 * Tabs — sibling views of one object (概览 / 字段 / 血缘). Selected: fg + 2px primary underline.
 * Use SegmentedControl to change how one block of data is displayed; use VerticalNav for ≥5 sub-modules.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ size = 'md', className, children }: { size?: 'sm' | 'md'; className?: string; children?: React.ReactNode }) {
  return (
    <TabsPrimitive.List data-size={size} className={cn('group/tabs flex items-end overflow-x-auto border-b border-border-subtle font-sans [scrollbar-width:none]', size === 'sm' ? 'gap-4.5' : 'gap-5.5', className)}>
      {children}
    </TabsPrimitive.List>
  );
}

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
  count?: number;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger({ icon, count, className, children, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'group/tab relative -mb-px inline-flex h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-px',
        'text-body-sm font-medium text-fg-muted outline-none transition-colors duration-100 group-data-[size=sm]/tabs:h-[34px] group-data-[size=sm]/tabs:text-code',
        'hover:text-fg data-[state=active]:border-primary data-[state=active]:text-fg focus-visible:rounded-xs focus-visible:shadow-focus-ring',
        'disabled:cursor-not-allowed disabled:text-fg-disabled [&_svg]:size-[15px] [&_svg]:text-fg-subtle data-[state=active]:[&_svg]:text-primary',
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {count != null && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface-active px-[5px] text-micro font-semibold text-fg-muted tabular-nums group-data-[state=active]/tab:bg-primary-soft group-data-[state=active]/tab:text-primary-hover">
          {count}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
});

export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('outline-none', className)} {...props} />;
});
