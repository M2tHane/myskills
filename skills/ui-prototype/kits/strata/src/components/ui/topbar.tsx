import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from './kbd';

/** 52px app bar: breadcrumb on the left; search, notifications, help, avatar on the right. */
export function Topbar({ start, end, className }: { start?: React.ReactNode; end?: React.ReactNode; className?: string }) {
  return (
    <header className={cn('flex h-(--header-height) shrink-0 items-center justify-between gap-4 border-b border-border bg-surface pr-4 pl-5 font-sans', className)}>
      <div className="flex min-w-0 items-center gap-1.5">{start}</div>
      <div className="flex min-w-0 items-center gap-1.5">{end}</div>
    </header>
  );
}

/** Global search entry: a sunken field with the ⌘K shortcut. Opens your command palette. */
export function SearchTrigger({ placeholder = '搜索', shortcut = ['⌘', 'K'], width = 240, onClick }: { placeholder?: string; shortcut?: string[]; width?: number; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width }}
      className="flex h-8 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface-sunken pr-1.5 pl-2.5 font-sans text-body-sm text-fg-subtle shadow-inset outline-none hover:border-border-strong hover:text-fg-muted focus-visible:shadow-focus-ring">
      <Search className="size-[15px] shrink-0" />
      <span className="flex-1 text-left">{placeholder}</span>
      <span className="inline-flex items-center gap-[3px]">{shortcut.map((k) => <Kbd key={k} className="h-[18px] min-w-[18px] px-1 text-badge">{k}</Kbd>)}</span>
    </button>
  );
}
