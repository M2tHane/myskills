/**
 * 数据助手（对话页样板）的假数据：会话列表、一段完整的历史对话、工作区文件，以及发送消息后的「剧本」。
 * 剧本按用户输入里的关键词挑选：含「导出」→ 先提问再导出；含「删除 / 清理」→ 先请用户确认再执行；其他 → 思考、查询、回答。
 */

export interface ChatFile { name: string; size: number }

export type ChatPart =
  | { kind: 'text'; text: string }
  | { kind: 'reasoning'; text: string; seconds: number }
  | { kind: 'tool'; title: string; name: string; status: 'running' | 'done' | 'error'; duration?: string; input: string; output?: string; error?: string }
  | { kind: 'ask-record'; items: Array<{ question: string; answer: string }> }
  | { kind: 'approval-record'; approved: boolean; title: string }
  | { kind: 'files'; files: ChatFile[] }
  | { kind: 'stopped' }
  | { kind: 'error'; message: string };

export interface ChatMessageRow { id: string; role: 'user' | 'assistant'; text?: string; files?: ChatFile[]; parts: ChatPart[] }
export interface ConversationRow { id: string; title: string; group: '今天' | '昨天' | '近 7 天' | '更早'; updated: string }

export const CONVERSATIONS: ConversationRow[] = [
  { id: 'c1', title: '上周华东区订单 GMV 分析', group: '今天', updated: '10:42' },
  { id: 'c2', title: '退款率为什么在 10 月上升', group: '今天', updated: '09:15' },
  { id: 'c3', title: '门店坪效排行与异常门店', group: '昨天', updated: '18:30' },
  { id: 'c4', title: '会员复购周期的口径确认', group: '昨天', updated: '14:02' },
  { id: 'c5', title: '新建「供应商履约」日报查询', group: '近 7 天', updated: '10-18' },
  { id: 'c6', title: 'orders_daily 字段含义', group: '近 7 天', updated: '10-17' },
  { id: 'c7', title: '双十一备货：华南区 SKU 缺货预测与补货建议（按仓库拆分）', group: '近 7 天', updated: '10-16' },
  { id: 'c8', title: '库存周转天数计算方式', group: '更早', updated: '10-09' },
  { id: 'c9', title: '渠道 ROI 对比', group: '更早', updated: '09-28' },
];

const GMV_SQL = `SELECT region, SUM(pay_amount) AS gmv, COUNT(*) AS orders
FROM orders_daily
WHERE dt BETWEEN '2026-10-12' AND '2026-10-18'
GROUP BY region
ORDER BY gmv DESC;`;

export const GMV_ANSWER = `上周（10 月 12 日 – 18 日）华东区 GMV 为 **¥1,284.6 万**，比前一周增长 **8.2%**，在各区中排第一。

| 区域 | GMV（万元） | 订单数 | 环比 |
|---|---|---|---|
| 华东 | 1,284.6 | 48,213 | +8.2% |
| 华南 | 932.1 | 36,870 | +3.1% |
| 华北 | 815.4 | 31,052 | −1.6% |

增长主要来自两处：
- 10 月 15 日的会员日，单日 GMV ¥286.3 万，占全周的 22%；
- 上海、杭州两个城市的客单价分别上涨 6.4% 和 5.1%。

### 口径
1. **GMV** 用实付金额 \`pay_amount\` 汇总，*不含*退款；
2. 「上周」按自然周，周一到周日：
   - 本周：10 月 12 日 – 18 日
   - 前一周：10 月 5 日 – 11 日

用到的 SQL：

\`\`\`sql
SELECT region, SUM(pay_amount) AS gmv, COUNT(*) AS orders
FROM orders_daily
WHERE dt BETWEEN '2026-10-12' AND '2026-10-18'
GROUP BY region
ORDER BY gmv DESC;
\`\`\`

需要的话，我可以按城市继续拆分，或把结果导出成报表。`;

export const MESSAGES: Record<string, ChatMessageRow[]> = {
  c1: [
    { id: 'm1', role: 'user', text: '上周华东区的 GMV 是多少？和前一周比怎么样？', parts: [] },
    {
      id: 'm2', role: 'assistant', parts: [
        { kind: 'reasoning', seconds: 4, text: '「上周」按自然周取 10 月 12 日到 18 日；GMV 用实付金额 pay_amount 汇总，口径和「运营周报」一致。先按区域汇总，再和前一周对比。' },
        { kind: 'tool', title: '查询上周各区域的 GMV 和订单数', name: 'run_sql', status: 'done', duration: '1.4 秒', input: GMV_SQL, output: '[\n  { "region": "华东", "gmv": 12846210.5, "orders": 48213 },\n  { "region": "华南", "gmv": 9321088.0, "orders": 36870 },\n  { "region": "华北", "gmv": 8154032.2, "orders": 31052 }\n]' },
        { kind: 'tool', title: '查询前一周的数据，用来算环比', name: 'run_sql', status: 'done', duration: '1.1 秒', input: GMV_SQL.replace("'2026-10-12' AND '2026-10-18'", "'2026-10-05' AND '2026-10-11'"), output: '[ … 3 行 ]' },
        { kind: 'text', text: GMV_ANSWER },
      ],
    },
    { id: 'm3', role: 'user', text: '按城市拆一下，附件是城市和区域的对应表。', files: [{ name: '城市区域对照表.xlsx', size: 48_312 }], parts: [] },
    {
      id: 'm4', role: 'assistant', parts: [
        { kind: 'tool', title: '读取附件里的城市和区域对应表', name: 'read_file', status: 'done', duration: '0.3 秒', input: '{ "file": "城市区域对照表.xlsx" }', output: '已读取 42 行（城市 → 区域）' },
        { kind: 'tool', title: '按城市汇总华东区的 GMV', name: 'run_sql', status: 'error', duration: '0.8 秒', input: 'SELECT city, SUM(pay_amount) …', error: 'column "city" does not exist（orders_daily 里城市字段叫 ship_city）' },
        { kind: 'tool', title: '城市字段名不对，改用 ship_city 重新汇总', name: 'run_sql', status: 'done', duration: '1.6 秒', input: 'SELECT ship_city, SUM(pay_amount) AS gmv …', output: '[ … 11 行 ]' },
        { kind: 'text', text: '华东区 11 个城市里，**上海**（¥412.8 万）和**杭州**（¥236.5 万）合计占 50.5%；增长最快的是**宁波**，环比 +17.3%。\n\n完整结果已经保存成文件，可以在右侧「文件」里查看。' },
        { kind: 'files', files: [{ name: '华东区城市GMV_1012-1018.csv', size: 3_182 }] },
      ],
    },
  ],
  c2: [
    { id: 'n1', role: 'user', text: '10 月的退款率为什么比 9 月高？', parts: [] },
    { id: 'n2', role: 'assistant', parts: [{ kind: 'text', text: '10 月退款率 4.8%，比 9 月高 1.1 个百分点，主要来自「七天无理由」退款，集中在 10 月 2 日 – 6 日的大促订单。' }] },
  ],
};

/** 右侧「文件」面板：工作区里 Agent 读过和生成的文件。有 children 的是文件夹。 */
export interface WorkspaceFile { name: string; children?: WorkspaceFile[] }

export const WORKSPACE: WorkspaceFile[] = [
  { name: '输出', children: [
    { name: '华东区城市GMV_1012-1018.csv' },
    { name: '周报_华东_第42周.md' },
    { name: '区域GMV趋势.png' },
  ] },
  { name: '附件', children: [
    { name: '城市区域对照表.xlsx' },
    { name: '运营周报口径说明.pdf' },
  ] },
  { name: 'queries', children: [
    { name: 'gmv_by_region.sql' },
    { name: 'gmv_by_city.sql' },
    { name: 'refund_rate_daily.sql' },
    { name: 'old_gmv_test.sql' },
  ] },
  { name: 'README.md' },
  { name: 'metrics.yaml' },
];

/* ------------------------------------------------------------------ 发送后的剧本 */

export interface AskQuestionData { id: string; header?: string; question: string; multiple?: boolean; options: Array<{ value: string; label: string; description?: string }> }

export type Step =
  | { do: 'think'; ms: number; text: string }
  | { do: 'tool'; ms: number; title: string; name: string; input: string; output?: string; error?: string }
  | { do: 'text'; text: string }
  | { do: 'files'; files: ChatFile[] }
  | { do: 'ask'; questions: AskQuestionData[]; then: (answers: Record<string, string[]>) => Step[] }
  | { do: 'approve'; title: string; tool: string; detail: string; danger?: boolean; facts?: string; approved: Step[]; denied: Step[] };

export function scriptFor(input: string): Step[] {
  if (/导出|下载|报表/.test(input)) {
    return [
      { do: 'think', ms: 900, text: '导出前需要确认格式和范围。' },
      {
        do: 'ask',
        questions: [
          { id: 'format', header: '格式', question: '导出成哪种格式？', options: [
            { value: 'csv', label: 'CSV', description: '原始数据，适合再加工' },
            { value: 'xlsx', label: 'Excel', description: '带表头格式和合计行' },
            { value: 'pdf', label: 'PDF 报告', description: '含图表，适合直接转发' },
          ] },
          { id: 'cols', header: '字段', question: '需要哪些字段？', multiple: true, options: [
            { value: 'gmv', label: 'GMV' }, { value: 'orders', label: '订单数' }, { value: 'aov', label: '客单价' }, { value: 'wow', label: '环比' },
          ] },
        ],
        then: (a) => {
          const fmt = a.format?.[0] ?? 'xlsx';
          const ext = fmt === 'pdf' ? 'pdf' : fmt === 'csv' ? 'csv' : 'xlsx';
          return [
            { do: 'tool', ms: 1300, title: '按选好的格式和字段生成导出文件', name: 'export_report', input: JSON.stringify({ format: fmt, columns: a.cols ?? [] }, null, 2), output: `已生成 1 个文件（${ext.toUpperCase()}）` },
            { do: 'text', text: `已按你的选择导出，共 ${(a.cols ?? []).length || 4} 个字段、11 行数据。` },
            { do: 'files', files: [{ name: `华东区城市GMV.${ext}`, size: ext === 'pdf' ? 412_800 : 18_640 }] },
          ];
        },
      },
    ];
  }
  if (/删除|清理|删掉/.test(input)) {
    return [
      { do: 'tool', ms: 900, title: '查找 7 月以前没运行过的查询', name: 'search_queries', input: '{ "last_run_before": "2026-07-01", "owner": "me" }', output: '找到 3 个：old_gmv_test、tmp_refund_check、副本-门店坪效' },
      {
        do: 'approve', title: '允许删除 3 个查询？', tool: 'delete_queries', danger: true,
        detail: '{\n  "ids": ["q_1029", "q_1033", "q_1041"],\n  "names": ["old_gmv_test", "tmp_refund_check", "副本-门店坪效"]\n}',
        facts: '删除后运行记录一起删除，无法恢复。',
        approved: [
          { do: 'tool', ms: 1000, title: '删除这 3 个查询', name: 'delete_queries', input: '{ "ids": ["q_1029", "q_1033", "q_1041"] }', output: '已删除 3 个' },
          { do: 'text', text: '已删除 3 个过期查询：`old_gmv_test`、`tmp_refund_check`、`副本-门店坪效`。' },
        ],
        denied: [{ do: 'text', text: '好的，没有删除。需要的话可以先把它们移到「归档」。' }],
      },
    ];
  }
  return [
    { do: 'think', ms: 1100, text: `理解问题：「${input.slice(0, 40)}」。先确认口径，再查最近一周的数据。` },
    { do: 'tool', ms: 1200, title: '查询上周各区域的 GMV 和订单数', name: 'run_sql', input: GMV_SQL, output: '[ … 3 行 ]' },
    { do: 'tool', ms: 900, title: '查询前一周的数据，用来算环比', name: 'run_sql', input: GMV_SQL.replace("'2026-10-12' AND '2026-10-18'", "'2026-10-05' AND '2026-10-11'"), output: '[ … 3 行 ]' },
    { do: 'text', text: GMV_ANSWER },
  ];
}

/** 对话框下方的模型选择器。 */
export const MODELS = [
  { value: 'pro', label: 'Pro', description: '复杂分析和日常问数' },
  { value: 'lite', label: 'Lite', description: '回答更快，额度消耗更少' },
];
export const MORE_MODELS = [
  { value: 'pro-long', label: 'Pro 长上下文', description: '一次读入更多表结构和附件' },
  { value: 'pro-1', label: 'Pro（上一版）', description: '和旧报表口径对齐时用' },
];
export const EFFORTS = [
  { value: 'low', label: '低', description: '最快' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高', description: '想得更久，适合多步分析' },
];

export const SUGGESTIONS = [
  '上周各区域 GMV 和环比',
  '把华东区城市 GMV 导出成报表',
  '10 月退款率为什么上升',
  '清理我 7 月以前没运行过的查询',
];
