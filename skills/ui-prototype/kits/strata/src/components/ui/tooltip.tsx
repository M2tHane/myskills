import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { KbdCombo } from './kbd';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  /** Keyboard shortcut shown as small keycaps after the label. */
  shortcut?: string[];
  /** dark: a short label (default) · light: an L2 card for richer content such as a list. */
  appearance?: 'dark' | 'light';
  delay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  children: React.ReactElement;
}

/**
 * Tooltip — portalled and collision-aware, so it never makes a scroll container scroll.
 * Every icon-only button must have one.
 */
export function Tooltip({ content, side = 'top', align = 'center', shortcut, appearance = 'dark', delay = 300, open, defaultOpen, children }: TooltipProps) {
  const light = appearance === 'light';
  return (
    <TooltipPrimitive.Provider delayDuration={delay} skipDelayDuration={200}>
      <TooltipPrimitive.Root open={open} defaultOpen={defaultOpen}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            className={cn(
              'z-[1000] inline-flex items-center gap-2 font-sans text-caption animate-fade-in',
              light
                ? 'rounded-md border border-border bg-surface-raised p-1 text-fg shadow-raised'
                : 'rounded-sm bg-tooltip px-2 py-[5px] font-medium text-fg-inverse shadow-raised',
            )}
          >
            {content}
            {shortcut && <KbdCombo keys={shortcut} inverse />}
            <TooltipPrimitive.Arrow
              width={10}
              height={5}
              className={cn(light ? 'fill-surface-raised stroke-border [stroke-width:1px]' : 'fill-tooltip')}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
