import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, inverse, children }: { className?: string; inverse?: boolean; children?: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-xs border px-[5px] font-mono text-micro font-medium',
        inverse
          ? 'h-[18px] min-w-[18px] px-1 border-tooltip-key-line bg-tooltip-key text-tooltip-fg-muted'
          : 'border-border-strong bg-surface text-fg-muted shadow-control',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function KbdCombo({ keys, inverse, className }: { keys: string[]; inverse?: boolean; className?: string }) {
  return <span className={cn('inline-flex items-center gap-[3px]', className)}>{keys.map((k) => <Kbd key={k} inverse={inverse}>{k}</Kbd>)}</span>;
}
