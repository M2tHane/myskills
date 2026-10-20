import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ButtonGroup — attached (shared borders, outer radii only) for parallel actions on one object,
 * or `attached={false}` for an 8px-gap group. A split button is a primary button + an icon button.
 */
export function ButtonGroup({ attached = true, className, children }: { attached?: boolean; className?: string; children?: React.ReactNode }) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center',
        attached
          ? [
              '[&>*]:rounded-none [&>*:not(:first-child)]:-ml-px [&>*:first-child]:rounded-l-sm [&>*:last-child]:rounded-r-sm',
              '[&>*:hover]:z-[1] [&>*:focus-visible]:z-[1]',
              '[&>[data-variant=default]+[data-variant=default]]:ml-0 [&>[data-variant=default]+[data-variant=default]]:border-l-primary-active',
            ]
          : 'gap-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
