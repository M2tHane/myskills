import * as React from 'react';
import { cn } from '@/lib/utils';

/** Single-column entries. Dividers are inset 12px on both sides. */
export function List({ divided = true, interactive, className, children }: { divided?: boolean; interactive?: boolean; className?: string; children?: React.ReactNode }) {
  return (
    <div role="list" data-divided={divided || undefined} data-interactive={interactive || undefined} className={cn('group/list flex flex-col font-sans', className)}>
      {children}
    </div>
  );
}

export interface ListItemProps {
  /** 32px sunken icon tile. */
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  title: React.ReactNode;
  /** Data, not explanation: type, address, size. */
  meta?: React.ReactNode;
  /** Status badge, time, or an action. */
  trailing?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({ icon, avatar, title, meta, trailing, selected, onClick, className }: ListItemProps) {
  return (
    <div
      role="listitem"
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      data-selected={selected || undefined}
      className={cn(
        'group/item relative flex min-h-13 items-center gap-3 rounded-sm px-3 py-2 outline-none focus-visible:shadow-focus-ring before:pointer-events-none before:absolute',
        'group-data-[divided]/list:[&+&]:before:absolute group-data-[divided]/list:[&+&]:before:inset-x-3 group-data-[divided]/list:[&+&]:before:top-0 group-data-[divided]/list:[&+&]:before:h-px group-data-[divided]/list:[&+&]:before:bg-border-subtle',
        (onClick || undefined) && 'cursor-pointer',
        'group-data-[interactive]/list:cursor-pointer group-data-[interactive]/list:hover:bg-surface-hover group-data-[interactive]/list:hover:before:opacity-0 group-data-[interactive]/list:[&:hover+&]:before:opacity-0',
        '[[data-selected]+&]:before:opacity-0',
        selected && 'bg-surface-selected before:opacity-0',
        className,
      )}
    >
      {avatar ?? (icon && (
        <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface-sunken text-fg-muted [&_svg]:size-4',
          selected && 'border-primary-line bg-surface text-primary')}>{icon}</span>
      ))}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-body-sm font-medium text-fg', selected && 'text-primary-hover')}>{title}</span>
        {meta != null && <span className="truncate text-caption leading-[18px] text-fg-subtle tabular-nums">{meta}</span>}
      </span>
      {trailing != null && <span className="flex shrink-0 items-center gap-2 text-caption text-fg-subtle tabular-nums [&_svg]:size-4">{trailing}</span>}
    </div>
  );
}
