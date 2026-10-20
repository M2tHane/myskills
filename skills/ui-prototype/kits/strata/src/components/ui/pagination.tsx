import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from './select';

/** Page sizes are fixed by the design rules. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;

function pageList(cur: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', cur - 1, cur, cur + 1, '…', total];
}

export interface PaginationProps {
  total: number;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** full: total · page size · pages · jump; simple: prev / next with “3 / 13”. */
  variant?: 'full' | 'simple';
  showJumper?: boolean;
  showSizeChanger?: boolean;
  className?: string;
}

const btn = cn(
  'inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-sm border border-transparent bg-transparent px-1.5 font-sans text-body-sm font-medium text-fg-muted tabular-nums outline-none',
  'transition-colors duration-100 hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring',
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled [&_svg]:size-4',
);

/**
 * Pagination. Up to 7 fixed-width (32px) slots so buttons never shift as pages change.
 * The current page is white with a primary-line border and primary-hover text.
 */
export function Pagination({
  total, page, defaultPage = 1, pageSize, defaultPageSize = 10, onPageChange, onPageSizeChange,
  variant = 'full', showJumper = true, showSizeChanger = true, className,
}: PaginationProps) {
  const [p, setP] = React.useState(defaultPage);
  const [ps, setPs] = React.useState(defaultPageSize);
  const [jump, setJump] = React.useState('');
  const size = pageSize ?? ps;
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page ?? p, pages);
  const go = (n: number) => { const v = Math.min(pages, Math.max(1, n)); setP(v); onPageChange?.(v); };
  const prev = <button type="button" aria-label="上一页" disabled={cur <= 1} onClick={() => go(cur - 1)} className={btn}><ChevronLeft /></button>;
  const next = <button type="button" aria-label="下一页" disabled={cur >= pages} onClick={() => go(cur + 1)} className={btn}><ChevronRight /></button>;
  if (variant === 'simple') {
    return (
      <nav aria-label="分页" className={cn('inline-flex items-center gap-1 font-sans text-body-sm text-fg-muted', className)}>
        {prev}<span className="min-w-14 text-center tabular-nums"><b className="font-semibold text-fg">{cur}</b> / {pages}</span>{next}
      </nav>
    );
  }
  return (
    <nav aria-label="分页" className={cn('flex w-full items-center justify-between gap-4 font-sans text-body-sm text-fg-muted', className)}>
      <span>共 <b className="font-semibold text-fg tabular-nums">{total.toLocaleString('zh-CN')}</b> 条</span>
      <span className="flex items-center gap-4">
        {showSizeChanger && (
          <Select size="sm" className="w-26" value={String(size)} searchable={false} placement="top"
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} 条/页` }))}
            onValueChange={(v) => { const n = Number(v); setPs(n); onPageSizeChange?.(n); go(1); }} />
        )}
        <span className="flex items-center gap-0.5">
          {prev}
          {pageList(cur, pages).map((n, i) => n === '…'
            ? <span key={'e' + i} className="inline-flex w-8 justify-center tracking-[1px] text-fg-subtle">…</span>
            : (
              <button key={n} type="button" aria-current={n === cur ? 'page' : undefined} onClick={() => go(n)}
                className={cn(btn, 'w-8 px-0', n === cur && 'border-primary-line bg-surface font-semibold text-primary-hover shadow-xs hover:bg-surface hover:text-primary-hover')}>{n}</button>
            ))}
          {next}
        </span>
        {showJumper && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            跳至
            <input value={jump} inputMode="numeric" aria-label="跳转页码"
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter' && jump) { go(Number(jump)); setJump(''); } }}
              className="h-7 w-12 rounded-sm border border-border-strong bg-surface px-1.5 text-center text-fg tabular-nums shadow-inset outline-none hover:border-(--gray-400) focus:border-ring focus:shadow-focus-input" />
            页
          </span>
        )}
      </span>
    </nav>
  );
}
