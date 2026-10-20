/** 概览页数据：指标、每日查询量、数据源状态、最近运行、用量。 */
import { useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { DAILY, QUERIES, WEEKS } from '@/mocks/db';

export type Range = '7d' | '30d' | '90d';

const getOverview = (range: Range) => delay({
  range,
  weeks: WEEKS,
  stats: {
    queries: { value: 1284, delta: '+12.4%', trend: [820, 910, 870, 990, 1040, 960, 1110, 1080, 1150, 1120, 1190, 1284] },
    latency: { value: 2.4, delta: '−0.3 s', trend: [3.4, 3.1, 3.3, 3.0, 2.9, 3.0, 2.8, 2.9, 2.7, 2.6, 2.7, 2.4] },
    success: { value: 99.2, delta: '−0.4 pt', trend: [99.7, 99.6, 99.8, 99.6, 99.7, 99.5, 99.6, 99.7, 99.6, 99.5, 99.6, 99.2] },
    users: { value: 326, delta: '+18', trend: [248, 262, 255, 271, 280, 276, 290, 288, 301, 296, 308, 326] },
  },
  daily: range === '7d' ? DAILY.slice(-7) : DAILY,
  dailyTotal: 31408,
  sources: [
    { name: 'pg-prod-02', kind: 'db', meta: 'PostgreSQL · 延迟 38 ms', status: '已连接', tone: 'success' as const },
    { name: 'clickhouse-olap', kind: 'db', meta: 'ClickHouse · 同步 64%', status: '同步中', tone: 'primary' as const },
    { name: 'mysql-crm', kind: 'db', meta: 'MySQL · 30 秒无响应', status: '连接失败', tone: 'danger' as const },
    { name: '门店月报.csv', kind: 'file', meta: 'CSV · 2.4 MB', status: '已停用', tone: 'neutral' as const },
  ],
  recent: QUERIES.slice(0, 6),
  usage: [
    { label: '查询额度', value: 92 }, { label: '存储空间', value: 62 }, { label: '导出次数', value: 38 },
    { label: '定时任务', value: 80 }, { label: '成员席位', value: 72 },
  ],
});

export const useOverview = (range: Range) => useQuery({ queryKey: ['overview', range], queryFn: () => getOverview(range), placeholderData: (prev) => prev });
