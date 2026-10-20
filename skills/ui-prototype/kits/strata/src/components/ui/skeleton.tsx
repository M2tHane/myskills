import * as React from 'react';
import { cn } from '@/lib/utils';

/** Placeholder bar that slowly breathes between surface-active and gray-150. Lay it out like the real content. */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden="true" className={cn('inline-block h-3 rounded-xs bg-surface-active align-middle animate-skeleton', className)} style={style} />;
}
