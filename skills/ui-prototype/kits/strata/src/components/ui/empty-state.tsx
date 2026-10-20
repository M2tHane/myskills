import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  /** States the situation: “还没有数据集”, “没有匹配‘门店月报’的结果”. */
  title: React.ReactNode;
  /** One line, only when the title cannot explain the cause (errors). */
  description?: React.ReactNode;
  /** The single next step. */
  action?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function EmptyState({ icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  const sm = size === 'sm';
  return (
    <div className={cn('flex flex-col items-center justify-center text-center font-sans', sm ? 'gap-1.5 px-4 py-7' : 'gap-2 px-6 py-8', className)}>
      <span className={cn('mb-1 inline-flex items-center justify-center rounded-md border border-border-subtle bg-surface-sunken text-fg-subtle shadow-inset',
        sm ? 'size-8 [&_svg]:size-4' : 'size-10 [&_svg]:size-5')}>{icon ?? <Inbox />}</span>
      <div className={cn('font-medium text-fg', sm ? 'text-body-sm' : 'text-body')}>{title}</div>
      {description != null && <div className="max-w-80 text-body-sm text-fg-muted">{description}</div>}
      {action != null && <div className="mt-1.5 flex gap-2">{action}</div>}
    </div>
  );
}
