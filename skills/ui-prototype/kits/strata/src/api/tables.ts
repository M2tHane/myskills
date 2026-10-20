/** 数据表资源：详情、字段、数据预览、每日新增。 */
import { useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { DAILY, FIELDS, QUERIES } from '@/mocks/db';

export type TableField = (typeof FIELDS)[number];
export interface TableDetail {
  name: string; kind: string; status: '已上线' | '已下线'; project: string; owner: string; schedule: string;
  rows: number; size: string; createdAt: string; updatedAt: string; description: string;
  source: { name: string; database: string; schema: string; readonly: boolean };
  fields: TableField[];
  daily: Array<{ label: string; value: number }>;
  usedBy: Array<{ id: string; name: string; owner: string; schedule: string; status: string; tone: (typeof QUERIES)[number]['tone'] }>;
  history: Array<{ who: string; what: string; when: string }>;
}

const getTable = (name: string) => delay<TableDetail>({
  name, kind: '物化视图', status: '已上线', project: '运营数据中心', owner: '张一鸣', schedule: '每天 02:00',
  rows: 12840562, size: '3.6 GB', createdAt: '2026-07-02 10:18', updatedAt: '2026-10-19 02:14',
  description: '华东区域近 90 天订单明细，按日汇总，供运营周报与区域看板使用。',
  source: { name: 'pg-prod-02', database: 'analytics', schema: 'public', readonly: true },
  fields: FIELDS,
  daily: DAILY.map((d) => ({ ...d, value: d.value * 14 })),
  usedBy: QUERIES.slice(0, 3).map(({ id, name: n, owner, schedule, status, tone }) => ({ id, name: n, owner, schedule, status, tone })),
  history: [
    { who: '张一鸣', what: '修改了刷新频率为 每天 02:00', when: '10-19 09:12' },
    { who: '李想', what: '新增字段 sku_count', when: '10-12 14:05' },
    { who: '王晓', what: '更新了描述', when: '09-30 18:20' },
    { who: '张一鸣', what: '创建了数据表', when: '07-02 10:18' },
  ],
});

const getPreview = (name: string) => delay(QUERIES.slice(0, 40).map((q, i) => ({
  id: String(202610190001 + i), table: name, region: ['华东', '华南', '华北', '西南'][i % 4], city: ['杭州', '广州', '北京', '成都'][i % 4],
  channel: ['小程序', 'App', '门店'][i % 3], amount: (q.rows % 900) + 0.5, at: q.updated,
})));

export const tableKeys = { detail: (name: string) => ['tables', name] as const, preview: (name: string) => ['tables', name, 'preview'] as const };
export const useTable = (name: string) => useQuery({ queryKey: tableKeys.detail(name), queryFn: () => getTable(name) });
export const useTablePreview = (name: string, enabled = true) => useQuery({ queryKey: tableKeys.preview(name), queryFn: () => getPreview(name), enabled });
