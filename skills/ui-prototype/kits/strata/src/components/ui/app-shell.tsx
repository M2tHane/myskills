import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  /** classic (default): white sidebar + white topbar + gray canvas content with white cards.
   *  inset: gray frame, the workspace is one raised white sheet. */
  variant?: 'classic' | 'inset';
  height?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export function AppShell({ sidebar, topbar, variant = 'classic', height = 'var(--app-height, 100vh)', className, children }: AppShellProps) {
  const inset = variant === 'inset';
  return (
    <div className={cn('flex min-h-0 overflow-hidden bg-canvas font-sans', className)} style={{ height }}>
      {sidebar}
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', inset && 'my-2 mr-2 overflow-hidden rounded-lg border border-border bg-surface shadow-card [&>header]:border-border-subtle')}>
        {topbar}
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/** Standard page body padding (24px) with 16px vertical rhythm. */
export function PageBody({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('flex flex-col gap-4 px-6 pt-4 pb-6', className)}>{children}</div>;
}

/**
 * 整页表单、向导的底部操作条：吸附在内容区底部（内容短时贴底，长时随滚动固定），
 * 左侧放辅助操作（上一步、保存草稿），右侧放取消和唯一的主操作。页面根节点用 `flex min-h-full flex-col`。
 */
export function ActionBar({ start, className, children }: { start?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('sticky bottom-0 z-[5] mt-auto flex min-h-14 items-center justify-between gap-2 border-t border-border bg-surface px-6 py-2.5 font-sans', className)}>
      <div className="flex items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
