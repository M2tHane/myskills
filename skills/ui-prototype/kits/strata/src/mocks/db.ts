/**
 * 模拟数据（演示用）。只有 src/api/ 可以引用这里；页面一律通过 src/api/ 取数。
 * 接真实后端时，只改 src/api/ 里的函数实现，页面代码不动。
 */
import { amount, date, derive, int, pick, rows, seq } from './gen';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export interface QueryRow { id: string; name: string; source: string; owner: string; tone: Tone; status: string; rows: number; ms: number; updated: string; schedule: string }

const NAMES = ['华东区域订单', '渠道转化漏斗', '库存周转分析', '用户留存', '会员画像', '退款原因分布', '商品动销率', '门店坪效', '物流时效', '优惠券核销', '新客首单', '复购周期', '客单价分层', '供应商履约', '仓配成本', '直播间转化', '搜索词热度', '流失预警', '大促战报', 'SKU 结构', '区域毛利', '价格带分析', '会员积分', '投诉工单'];
export const OWNERS = ['张一鸣', '李想', '王晓', '陈静', '刘洋', '赵磊', '孙悦', '周宁', '吴迪', '郑凯'];
export const SOURCES = ['pg-prod-02', 'clickhouse-olap', 'mysql-crm', '门店月报.csv'];
const TONE: Record<string, Tone> = { 运行中: 'primary', 已完成: 'success', 待审核: 'warning', 失败: 'danger', 草稿: 'neutral' };
const rnd = (i: number) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); };

export const QUERIES: QueryRow[] = rows(46, {
  id: seq('q', 0),
  name: derive((_, i) => NAMES[i % NAMES.length] + (i >= NAMES.length ? ' · 副本' : '')),
  source: pick(SOURCES),
  owner: pick(OWNERS.slice(0, 6)),
  status: pick({ 运行中: 1, 已完成: 3, 待审核: 1, 失败: 1, 草稿: 1 }),
  tone: derive((r) => TONE[r.status as string]),
  rows: int(1200, 481_199),
  ms: amount(0.3, 6.3),
  updated: date('2026-09-20', '2026-10-19', { time: true }),
  schedule: pick(['每天 02:00', '每小时', '每周一 08:00', '手动']),
}, 46);

export const FIELDS = [
  ['order_id', 'bigint', '订单号', false, '202610190001'], ['created_at', 'timestamp', '下单时间', false, '2026-10-19 08:12:03'],
  ['region', 'varchar(16)', '区域', false, '华东'], ['city', 'varchar(32)', '城市', true, '杭州'],
  ['channel', 'varchar(16)', '渠道', false, '小程序'], ['pay_amount', 'decimal(12,2)', '支付金额', false, '268.00'],
  ['discount', 'decimal(12,2)', '优惠金额', true, '20.00'], ['member_level', 'varchar(8)', '会员等级', true, 'V3'],
  ['is_first', 'boolean', '是否首单', false, 'false'], ['refund_status', 'varchar(16)', '退款状态', true, '无'],
  ['sku_count', 'int', '商品件数', false, '3'], ['user_level', 'varchar(8)', '用户等级（即将下线）', true, 'B'],
].map(([name, type, desc, nullable, sample]) => ({ name: name as string, type: type as string, desc: desc as string, nullable: nullable as boolean, sample: sample as string }));

export const WEEKS = Array.from({ length: 12 }, (_, i) => `第 ${i + 31} 周`);
export const DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 8, 20 + i);
  return { label: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round(900 + Math.sin(i / 3) * 160 + rnd(i + 21) * 220 + i * 9) };
});

/* ----------------------------------------------------------- 数据源 */
export type SourceKind = 'postgres' | 'mysql' | 'clickhouse' | 'csv';
export interface SourceRow { id: string; name: string; kind: SourceKind; host: string; database: string; tables: number; status: '已连接' | '同步中' | '连接失败' | '已停用'; tone: Tone; owner: string; updated: string }
export const SOURCE_ROWS: SourceRow[] = [
  { id: 's1', name: 'pg-prod-02', kind: 'postgres', host: '10.20.8.14:5432', database: 'analytics', tables: 128, status: '已连接', tone: 'success', owner: '张一鸣', updated: '2026-10-19 02:14' },
  { id: 's2', name: 'clickhouse-olap', kind: 'clickhouse', host: '10.20.9.3:8123', database: 'events', tables: 36, status: '同步中', tone: 'primary', owner: '李想', updated: '2026-10-19 09:40' },
  { id: 's3', name: 'mysql-crm', kind: 'mysql', host: '10.20.4.21:3306', database: 'crm', tables: 54, status: '连接失败', tone: 'danger', owner: '王晓', updated: '2026-10-18 22:05' },
  { id: 's4', name: '门店月报.csv', kind: 'csv', host: '—', database: '—', tables: 1, status: '已停用', tone: 'neutral', owner: '陈静', updated: '2026-09-30 18:20' },
];
export const REMOTE_TABLES = [
  { schema: 'public', tables: [['orders', '12.8M'], ['order_items', '48.1M'], ['users', '2.3M'], ['coupons', '310K']] },
  { schema: 'ops', tables: [['stores', '1,204'], ['refunds', '86K'], ['shipments', '9.6M']] },
  { schema: 'audit', tables: [['login_events', '4.1M']] },
];

/* -------------------------------------------------------------- 设置 */
export const SETTINGS = {
  workspace: { name: '运营数据中心', slug: 'ops-data', timezone: 'Asia/Shanghai', language: 'zh-CN', defaultSource: 'pg-prod-02', weekStart: 'monday' },
  notifications: { failed: true, slow: true, quota: true, weekly: false, channel: 'email', recipients: ['张一鸣', '李想'] },
  security: { sessionHours: '8', twoFactor: true, ipAllowlist: '10.20.0.0/16\n172.16.8.0/24', exportApproval: true },
};

/* -------------------------------------------------------------- 成员 */
export interface MemberRow { id: string; name: string; email: string; role: '管理员' | '数据分析' | '只读'; status: '已加入' | '邀请中' | '已停用'; tone: Tone; lastActive: string }
export const MEMBERS: MemberRow[] = [
  { id: 'm1', name: '李想', email: 'lixiang@example.com', role: '管理员', status: '已加入', tone: 'success', lastActive: '2026-10-19 09:40' },
  { id: 'm2', name: '张一鸣', email: 'zhangyiming@example.com', role: '数据分析', status: '已加入', tone: 'success', lastActive: '2026-10-19 08:56' },
  { id: 'm3', name: '王晓', email: 'wangxiao@example.com', role: '数据分析', status: '已加入', tone: 'success', lastActive: '2026-10-18 22:05' },
  { id: 'm4', name: '陈静', email: 'chenjing@example.com', role: '只读', status: '已加入', tone: 'success', lastActive: '2026-10-17 15:32' },
  { id: 'm5', name: '刘洋', email: 'liuyang@example.com', role: '数据分析', status: '邀请中', tone: 'warning', lastActive: '—' },
  { id: 'm6', name: '赵磊', email: 'zhaolei@example.com', role: '只读', status: '已停用', tone: 'neutral', lastActive: '2026-08-02 10:11' },
];
