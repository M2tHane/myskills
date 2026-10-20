import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb { label: React.ReactNode; href?: string; onClick?: () => void }

/** Non-last crumbs fg-muted and clickable; the last is fg/500. Shown when depth ≥ 2. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="面包屑" className={cn('flex min-w-0 items-center gap-1 font-sans text-body-sm', className)}>
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" className="truncate font-medium text-fg">{c.label}</span>
            ) : (
              <a href={c.href ?? '#'} onClick={(e) => { if (!c.href) e.preventDefault(); c.onClick?.(); }}
                className="whitespace-nowrap rounded-xs px-0.5 text-fg-muted no-underline outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring">{c.label}</a>
            )}
            {!last && <ChevronRight className="size-3.5 shrink-0 text-(--gray-400)" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
