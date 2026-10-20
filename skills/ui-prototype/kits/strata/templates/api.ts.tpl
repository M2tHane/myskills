/**
 * __noun__：页面只从这里取数据。由 scripts/new-page.mjs 生成，类型和字段照 PRD 改（TODO(prd)）。
 * - use__Name__List()：全部数据，表格自己分页
 * - use__Name__Detail(id)：找不到时返回 null
 * 原型里的保存、删除等按钮只弹提示，这里不写改数据的接口。
 */
import { useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { __UPPER___ROWS, __UPPER___STATUSES, type __Name__Row, type __Name__Status } from '@/mocks/__kebab__';

export type { __Name__Row, __Name__Status };
export const __camel__Statuses = __UPPER___STATUSES;

const api = {
  list: () => delay(__UPPER___ROWS),
  get: (id: string) => delay(__UPPER___ROWS.find((r) => r.id === id) ?? null),
};

export const __camel__Keys = { list: ['__kebab__', 'list'] as const, detail: (id: string) => ['__kebab__', 'detail', id] as const };
export const use__Name__List = () => useQuery({ queryKey: __camel__Keys.list, queryFn: api.list });
export const use__Name__Detail = (id?: string) => useQuery({ queryKey: __camel__Keys.detail(id ?? ''), queryFn: () => api.get(id!), enabled: !!id });
