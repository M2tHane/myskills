/**
 * __noun__：页面只从这里取数据。由 scripts/new-page.mjs 生成，类型和字段照 PRD 改（TODO(prd)）。
 * - 读：use__Name__List(params)（服务端分页）、use__Name__Detail(id)
 * - 写：useCreate__Name__()、useUpdate__Name__()、useDelete__Name__()
 * 接真实接口时只改下面 api 里的函数（如 fetch(`/api/__kebab__?page=…`)），hooks 和页面不动。
 */
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { paginate } from '@/mocks/paginate';
import { __UPPER___ROWS, __UPPER___STATUSES, type __Name__Row, type __Name__Status } from '@/mocks/__kebab__';
import type { ListParams } from './paging';
import { queryClient } from './query-client';

export type { __Name__Row, __Name__Status };
export const __camel__Statuses = __UPPER___STATUSES;
/** 列表的筛选条件。TODO(prd) 照页面规格的筛选项改。 */
export type __Name__ListParams = ListParams<{ status?: __Name__Status }>;
/** 新建、编辑时提交的字段。TODO(prd) */
export type __Name__Input = Pick<__Name__Row, 'name' | 'status' | 'owner' | 'note'>;

let rows = [...__UPPER___ROWS];
const now = () => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const api = {
  list: (p: __Name__ListParams) => delay(paginate(rows, p, (r) => [r.code, r.name])),
  get: (id: string) => delay(rows.find((r) => r.id === id) ?? null),
  create: (input: __Name__Input) => {
    const row: __Name__Row = { ...input, id: String(Date.now()), code: `__PREFIX__-${String(rows.length + 1).padStart(4, '0')}`, updated: now() };
    rows = [row, ...rows];
    return delay(row, 600);
  },
  update: (id: string, input: __Name__Input) => {
    rows = rows.map((r) => (r.id === id ? { ...r, ...input, updated: now() } : r));
    return delay(rows.find((r) => r.id === id)!, 600);
  },
  remove: (id: string) => { rows = rows.filter((r) => r.id !== id); return delay(id, 400); },
};

/** 查询键集中定义，写操作成功后让同一前缀的查询失效。 */
export const __camel__Keys = {
  all: ['__kebab__'] as const,
  list: (p: __Name__ListParams) => [...__camel__Keys.all, 'list', p] as const,
  detail: (id: string) => [...__camel__Keys.all, 'detail', id] as const,
};
const invalidate = () => queryClient.invalidateQueries({ queryKey: __camel__Keys.all });

// keepPreviousData：翻页、筛选时先保留上一页，不闪骨架
export const use__Name__List = (p: __Name__ListParams) => useQuery({ queryKey: __camel__Keys.list(p), queryFn: () => api.list(p), placeholderData: keepPreviousData });
export const use__Name__Detail = (id?: string) => useQuery({ queryKey: __camel__Keys.detail(id ?? ''), queryFn: () => api.get(id!), enabled: !!id });
export const useCreate__Name__ = () => useMutation({ mutationFn: api.create, onSuccess: invalidate });
export const useUpdate__Name__ = () => useMutation({ mutationFn: ({ id, input }: { id: string; input: __Name__Input }) => api.update(id, input), onSuccess: invalidate });
export const useDelete__Name__ = () => useMutation({ mutationFn: api.remove, onSuccess: invalidate });
