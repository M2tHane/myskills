/**
 * __noun__的假数据，由 scripts/new-page.mjs 生成。
 * TODO(prd) 字段照页面规格改。二三十条、各种状态都有、带边界样例（超长名称、空值，用 withEdges）就够，不需要真实，也不需要和验收标准对上。
 */
import { EDGE, date, org, person, pick, rows, seq, text, withEdges } from './gen';

export const __UPPER___STATUSES = ['启用', '待审核', '停用'] as const;
export type __Name__Status = (typeof __UPPER___STATUSES)[number];
export interface __Name__Row { id: string; code: string; name: string; status: __Name__Status; owner: string; updated: string; note: string }

export const __UPPER___ROWS: __Name__Row[] = withEdges(rows(30, {
  id: seq('', 1),
  code: seq('__PREFIX__-', 1, 4),
  name: org(),
  status: pick({ 启用: 20, 待审核: 6, 停用: 4 }),
  owner: person(),
  updated: date('2026-09-01', '2026-10-19', { time: true }),
  note: text(6, 30),
}, __SEED__), [{ name: EDGE.longName }, { note: '' }]);
