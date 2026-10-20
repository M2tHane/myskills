import type { ListParams, Paged } from '@/api/paging';

/**
 * 在假数据里模拟服务端分页：按关键字和筛选条件过滤 → 排序 → 取第 page 页，返回 { items, total }。
 * search 返回参与关键字搜索的字段；filters 里没有值（undefined、''）的条件不生效，其余按相等比较。
 */
export function paginate<T extends object>(list: T[], p: ListParams<Partial<T>>, search: (row: T) => string[] = () => []): Paged<T> {
  const q = p.q?.trim();
  const conds = Object.entries(p.filters ?? {}).filter(([, v]) => v !== undefined && v !== '');
  const field = (r: T, k: string) => (r as Record<string, unknown>)[k];
  let out = list.filter((r) => (!q || search(r).some((s) => s.includes(q))) && conds.every(([k, v]) => field(r, k) === v));
  if (p.sort) {
    const { key, dir } = p.sort;
    out = [...out].sort((a, b) => {
      const x = field(a, key) as string | number, y = field(b, key) as string | number;
      const d = x < y ? -1 : x > y ? 1 : 0;
      return dir === 'asc' ? d : -d;
    });
  }
  const start = (p.page - 1) * p.pageSize;
  return { items: out.slice(start, start + p.pageSize), total: out.length };
}
