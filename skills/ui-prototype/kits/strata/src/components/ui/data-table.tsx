import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import { EmptyState } from './empty-state';
import { Pagination } from './pagination';
import { Skeleton } from './skeleton';

export interface Column<T> {
  key: string;
  title: React.ReactNode;
  /**
   * 基准宽度（px）。表格比各列之和宽时，所有数据列按基准宽度等比放大；更窄时先把可压缩的列
   * 压到 minWidth，再出现横向滚动。不写 width 的列按 240 计、最小 160。
   */
  width?: number;
  /** 最小宽度（px）。写了 width 而不写 minWidth 的列不压缩。 */
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Value used for sorting; defaults to row[key]. */
  sortValue?: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
  /** Numeric column: right aligned, tabular figures. */
  numeric?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  defaultSelected?: string[];
  onSelectionChange?: (keys: string[]) => void;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  /** 10 / 20 / 50 / 100. */
  pageSize?: number;
  pagination?: boolean;
  /** Search, filters, export, the primary action. */
  toolbar?: React.ReactNode;
  /** Replaces the toolbar while rows are selected. */
  bulkActions?: (keys: string[], clear: () => void) => React.ReactNode;
  /** Up to three small ghost IconButtons, shown on row hover. */
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  activeRowKey?: string;
  loading?: boolean;
  empty?: React.ReactNode;
  density?: 'default' | 'compact';
  maxHeight?: number;
  className?: string;
}

const CHECK_W = 44;
const ACTIONS_W = 104;
const FLEX_BASE = 240;
const FLEX_MIN = 160;

/** 按基准宽度把可用宽度分给各列：宽了等比放大，窄了先压缩可压缩列，再横向滚动。 */
function fitWidths<T>(columns: Column<T>[], avail: number): number[] {
  const base = columns.map((c) => c.width ?? FLEX_BASE);
  const min = columns.map((c, i) => Math.min(base[i], c.minWidth ?? (c.width == null ? FLEX_MIN : base[i])));
  const sum = base.reduce((a, b) => a + b, 0);
  if (avail <= 0) return base;
  let out: number[];
  if (avail >= sum) out = base.map((b) => (b * avail) / sum);
  else {
    const room = base.map((b, i) => b - min[i]);
    const total = room.reduce((a, b) => a + b, 0);
    const k = total > 0 ? Math.min(1, (sum - avail) / total) : 0;
    out = base.map((b, i) => b - room[i] * k);
  }
  out = out.map(Math.floor);
  if (avail >= sum) out[0] += avail - out.reduce((a, b) => a + b, 0);
  return out;
}

/** Table in an L1 card: toolbar → sunken header → 40px rows → pagination flush with the bottom. */
export function DataTable<T>({
  columns, data, rowKey, selectable, defaultSelected = [], onSelectionChange, defaultSort, pageSize = 10, pagination = true,
  toolbar, bulkActions, rowActions, onRowClick, activeRowKey, loading, empty, density = 'default', maxHeight, className,
}: DataTableProps<T>) {
  const [sel, setSel] = React.useState<string[]>(defaultSelected);
  const [sort, setSort] = React.useState(defaultSort);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(pageSize);
  const select = (k: string[]) => { setSel(k); onSelectionChange?.(k); };
  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r: T) => (col?.sortValue ? col.sortValue(r) : (r as Record<string, unknown>)[sort.key] as string | number);
    return [...data].sort((a, b) => { const x = val(a), y = val(b); const d = x < y ? -1 : x > y ? 1 : 0; return sort.dir === 'asc' ? d : -d; });
  }, [data, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const cur = Math.min(page, pages);
  const rows = pagination ? sorted.slice((cur - 1) * size, cur * size) : sorted;
  const keys = rows.map(rowKey);
  const allOn = keys.length > 0 && keys.every((k) => sel.includes(k));
  const someOn = keys.some((k) => sel.includes(k));
  const toggleSort = (k: string) => setSort((s) => (s?.key !== k ? { key: k, dir: 'desc' } : s.dir === 'desc' ? { key: k, dir: 'asc' } : undefined));
  const span = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const bulk = !!bulkActions && sel.length > 0;
  const align = (c: Column<T>) => c.align ?? (c.numeric ? 'right' : 'left');
  const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setBoxW(el.clientWidth);
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fixedW = (selectable ? CHECK_W : 0) + (rowActions ? ACTIONS_W : 0);
  const widths = React.useMemo(() => fitWidths(columns, boxW - fixedW), [columns, boxW, fixedW]);
  const tableW = boxW ? fixedW + widths.reduce((a, b) => a + b, 0) : undefined;
  const tdH = density === 'compact' ? 'h-(--row-compact)' : 'h-(--row)';
  const th = 'sticky top-0 z-[1] h-9 whitespace-nowrap border-b border-border-subtle bg-surface-sunken px-3 text-caption font-medium text-fg-muted';
  const td = cn(tdH, 'overflow-hidden text-ellipsis whitespace-nowrap border-b border-border-subtle px-3');

  return (
    <div className={cn('flex min-w-0 flex-col rounded-md border border-border bg-surface font-sans shadow-card', className)}>
      {(toolbar || bulk) && (
        <div className={cn('flex min-h-14 items-center gap-2 rounded-t-md border-b border-border-subtle p-3', bulk && 'border-primary-line bg-surface-selected')}>
          {bulk ? (
            <>
              <span className="px-1 text-body-sm text-primary-hover">已选 <b className="font-semibold tabular-nums">{sel.length}</b> 项</span>
              <span className="ml-2 flex items-center gap-2">{bulkActions!(sel, () => select([]))}</span>
              <button type="button" onClick={() => select([])}
                className="ml-auto h-7 cursor-pointer rounded-sm px-2 text-body-sm font-medium text-link hover:bg-primary-soft-hover">取消选择</button>
            </>
          ) : toolbar}
        </div>
      )}
      <div ref={wrapRef} className={cn('overflow-auto', !(toolbar || bulk) && 'rounded-t-md')} style={maxHeight ? { maxHeight } : undefined}>
        <table style={{ width: tableW ?? '100%' }} className="table-fixed border-separate border-spacing-0 text-body-sm text-fg">
          <colgroup>
            {selectable && <col style={{ width: CHECK_W }} />}
            {columns.map((c, i) => <col key={c.key} style={{ width: widths[i] }} />)}
            {rowActions && <col style={{ width: ACTIONS_W }} />}
          </colgroup>
          <thead>
            <tr>
              {selectable && (
                <th className={cn(th, 'pr-0 pl-4')}>
                  <Checkbox className="align-middle" checked={allOn} indeterminate={!allOn && someOn}
                    onCheckedChange={(c) => select(c ? Array.from(new Set([...sel, ...keys])) : sel.filter((k) => !keys.includes(k)))} aria-label="全选当前页" />
                </th>
              )}
              {columns.map((c) => {
                const on = sort?.key === c.key;
                return (
                  <th key={c.key} className={cn(th, alignCls[align(c)])} aria-sort={on ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {c.sortable ? (
                      <button type="button" onClick={() => toggleSort(c.key)}
                        className={cn('-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-xs px-1 py-0.5 outline-none hover:bg-surface-active hover:text-fg focus-visible:shadow-focus-ring', on && 'text-fg')}>
                        {c.title}
                        <span className="inline-flex flex-col text-(--gray-400) [&_svg]:-my-[3px] [&_svg]:size-3">
                          <ChevronUp strokeWidth={2.5} className={cn(on && sort!.dir === 'asc' && 'text-primary', on && sort!.dir === 'desc' && 'opacity-45')} />
                          <ChevronDown strokeWidth={2.5} className={cn(on && sort!.dir === 'desc' && 'text-primary', on && sort!.dir === 'asc' && 'opacity-45')} />
                        </span>
                      </button>
                    ) : c.title}
                  </th>
                );
              })}
              {rowActions && <th className={th} />}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: Math.min(size, 5) }, (_, i) => (
              <tr key={'s' + i}>
                {selectable && <td className={cn(td, 'pr-0 pl-4')}><Skeleton className="size-4 rounded-xs" /></td>}
                {columns.map((c, j) => <td key={c.key} className={cn(td, alignCls[align(c)])}><Skeleton style={{ width: j === 0 ? '70%' : c.numeric ? '50%' : '60%' }} /></td>)}
                {rowActions && <td className={td} />}
              </tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={span} className="border-0">{empty ?? <EmptyState size="sm" title="暂无数据" />}</td></tr>
            ) : rows.map((r, ri) => {
              const k = rowKey(r);
              const on = sel.includes(k);
              const last = ri === rows.length - 1;
              return (
                <tr key={k} onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn('group/row transition-colors duration-100 hover:[&>td]:bg-surface-hover', onRowClick && 'cursor-pointer', activeRowKey === k && '[&>td]:bg-surface-hover')}>
                  {selectable && (
                    <td className={cn(td, 'pr-0 pl-4', last && 'border-b-0')} onClick={(e) => e.stopPropagation()}>
                      <Checkbox className="align-middle" checked={on} onCheckedChange={(c) => select(c ? [...sel, k] : sel.filter((x) => x !== k))} aria-label="选择此行" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn(td, alignCls[align(c)], c.numeric && 'tabular-nums', last && 'border-b-0')}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}</td>
                  ))}
                  {rowActions && (
                    <td className={cn(td, 'overflow-visible text-right', last && 'border-b-0')} onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex gap-0.5 opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-within:opacity-100">{rowActions(r)}</span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && !loading && sorted.length > 0 && (
        <div className="flex min-h-13 items-center rounded-b-md border-t border-border-subtle bg-surface py-2.5 pr-3 pl-4">
          <Pagination total={sorted.length} page={cur} pageSize={size} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />
        </div>
      )}
    </div>
  );
}
