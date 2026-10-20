import * as React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumb, type Crumb } from './breadcrumb';

export interface PageHeaderProps {
  /** Only for pages without a Topbar. In the app shell the Topbar carries the breadcrumb. */
  breadcrumb?: Crumb[];
  title: React.ReactNode;
  /** Right after the title: a status Badge or a CountBadge. Never an explanatory sentence. */
  meta?: React.ReactNode;
  /** Primary action rightmost. */
  actions?: React.ReactNode;
  /** A TabsList that sits on the header's bottom edge. */
  tabs?: React.ReactNode;
  className?: string;
}

export function PageHeader({ breadcrumb, title, meta, actions, tabs, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 px-6 pt-5 font-sans', tabs == null ? 'pb-1' : 'pb-0', className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex min-h-9 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="m-0 truncate text-title-1 font-semibold tracking-[-0.015em] text-fg">{title}</h1>
          {meta}
        </div>
        {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs != null && <div className="mt-2.5">{tabs}</div>}
    </div>
  );
}
