/**
 * 查询（Query）资源。页面只能从这里拿数据：
 * - 读：useQueryList()、useQueryDetail(id)
 * - 写：useCreateQuery()、useDeleteQueries()、useDuplicateQuery()
 * 换成真实接口时，只改下面的 fetch 函数（如改成 fetch('/api/queries')），hooks 与页面不动。
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { OWNERS, QUERIES, SOURCES, type QueryRow, type Tone } from '@/mocks/db';
import { queryClient } from './query-client';

export type { QueryRow, Tone };
export const owners = OWNERS;
export const sources = SOURCES;

let rows = [...QUERIES];

export interface CreateQueryInput { name: string; source: string; owner: string; schedule: string; description?: string }

const api = {
  list: () => delay(rows),
  get: (id: string) => delay(rows.find((r) => r.id === id) ?? null),
  create: (input: CreateQueryInput) => {
    const row: QueryRow = { id: 'q' + Date.now(), name: input.name, source: input.source, owner: input.owner, schedule: input.schedule, tone: 'neutral', status: '草稿', rows: 0, ms: 0, updated: '2026-10-19 12:00' };
    rows = [row, ...rows];
    return delay(row);
  },
  update: (id: string, input: Partial<CreateQueryInput>) => {
    rows = rows.map((r) => (r.id === id ? { ...r, ...input } : r));
    return delay(rows.find((r) => r.id === id)!);
  },
  remove: (ids: string[]) => { const removed = rows.filter((r) => ids.includes(r.id)); rows = rows.filter((r) => !ids.includes(r.id)); return delay(removed); },
  restore: (items: QueryRow[]) => { rows = [...items, ...rows]; return delay(items); },
  duplicate: (id: string) => {
    const src = rows.find((r) => r.id === id)!;
    const copy = { ...src, id: src.id + '-' + Date.now(), name: src.name + ' · 副本' };
    rows = [copy, ...rows];
    return delay(copy);
  },
};

/** 查询键集中定义，失效时用同一个前缀。 */
export const queryKeys = {
  all: ['queries'] as const,
  list: () => [...queryKeys.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
};
const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.all });

export const useQueryList = () => useQuery({ queryKey: queryKeys.list(), queryFn: api.list });
export const useQueryDetail = (id?: string) => useQuery({ queryKey: queryKeys.detail(id ?? ''), queryFn: () => api.get(id!), enabled: !!id });
export const useCreateQuery = () => useMutation({ mutationFn: api.create, onSuccess: invalidate });
export const useUpdateQuery = () => useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CreateQueryInput> }) => api.update(id, input), onSuccess: invalidate });
export const useDeleteQueries = () => useMutation({ mutationFn: api.remove, onSuccess: invalidate });
export const useRestoreQueries = () => useMutation({ mutationFn: api.restore, onSuccess: invalidate });
export const useDuplicateQuery = () => useMutation({ mutationFn: api.duplicate, onSuccess: invalidate });
