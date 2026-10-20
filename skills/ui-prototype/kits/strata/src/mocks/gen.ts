/**
 * 假数据生成器：固定种子，同一个种子每次生成的数据完全一样（刷新页面、换机器都不变）。
 *
 *   const ORDERS = withEdges(rows(30, {
 *     id: seq('PO-', 1, 4),                                  // PO-0001、PO-0002…
 *     status: pick({ 已完成: 20, 待审核: 7, 失败: 3 }),       // 30 条里正好 3 条「失败」
 *     tone: derive((r) => TONE[r.status as string]),          // 由前面的字段算出来
 *     buyer: person(), supplier: org(),
 *     amount: amount(200, 50_000), qty: int(1, 99), urgent: bool(0.2),
 *     created: date('2026-09-01', '2026-10-19', { time: true }),
 *     note: text(8, 30),
 *   }, 7), [{ supplier: EDGE.longName }, { note: '' }, { amount: EDGE.huge }]);
 *
 * pick、bool 的比例是精确的：先按比例分好数量再打乱，不是逐条掷骰子。
 */

export type Rand = () => number;
/** 一个字段：拿到总条数和随机数，返回「第 i 条的值」。 */
export type Field<T> = (n: number, rand: Rand) => (i: number, row: Record<string, unknown>) => T;
type Row<F> = { [K in keyof F]: F[K] extends Field<infer T> ? T : never };

/** mulberry32：32 位种子的伪随机数，返回 [0, 1)。 */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand: Rand, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const choose = <T>(rand: Rand, list: readonly T[]) => list[Math.floor(rand() * list.length)];

function shuffle<T>(list: T[], rand: Rand): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** 按权重把 n 分成整数份：先取整，余下的按小数部分从大到小补，总数正好是 n。 */
function allocate(n: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (sum > 0 ? (n * w) / sum : 0));
  const counts = exact.map(Math.floor);
  const order = exact.map((x, k) => [x - Math.floor(x), k] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let left = n - counts.reduce((a, b) => a + b, 0), j = 0; left > 0; left--, j++) counts[order[j % order.length][1]]++;
  return counts;
}

/** 生成 n 条数据。字段按书写顺序生成，derive 可以用前面的字段。 */
export function rows<F extends Record<string, Field<unknown>>>(n: number, fields: F, seed: number): Row<F>[] {
  const rand = mulberry32(seed);
  const gens = Object.entries(fields).map(([key, field]) => [key, field(n, rand)] as const);
  return Array.from({ length: n }, (_, i) => {
    const row: Record<string, unknown> = {};
    for (const [key, gen] of gens) row[key] = gen(i, row);
    return row as Row<F>;
  });
}

/** 递增编号：seq('PO-', 1, 4) → PO-0001、PO-0002… */
export const seq = (prefix = '', start = 1, pad = 0): Field<string> => () => (i) => prefix + String(start + i).padStart(pad, '0');

/** 按权重取值，比例精确：pick({ 已完成: 17, 失败: 3 }) 在 20 条里正好 3 条「失败」。传数组时各项权重相同。 */
export function pick<K extends string>(options: Record<K, number> | readonly K[]): Field<K> {
  const entries: [K, number][] = Array.isArray(options) ? options.map((k) => [k, 1]) : (Object.entries(options) as [K, number][]);
  return (n, rand) => {
    const counts = allocate(n, entries.map(([, w]) => w));
    const pool = shuffle(entries.flatMap(([k], j) => Array<K>(counts[j]).fill(k)), rand);
    return (i) => pool[i];
  };
}

/** 是 / 否，比例精确：bool(0.2) 在 30 条里正好 6 条 true。 */
export const bool = (rate: number): Field<boolean> => (n, rand) => {
  const yes = Math.round(n * rate);
  const pool = shuffle(Array.from({ length: n }, (_, i) => i < yes), rand);
  return (i) => pool[i];
};

/** 由同一行前面的字段算出来：derive((r) => TONE[r.status as Status])。 */
export const derive = <T>(fn: (row: Record<string, unknown>, i: number) => T): Field<T> => () => (i, row) => fn(row, i);

const SURNAMES = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何林罗高郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤';
const GIVEN = '伟芳娜敏静丽强磊军洋勇艳杰娟涛明超秀霞平刚桂英华玉兰萍红鹏辉宇浩凯晨欣怡婷雪琳颖佳嘉俊子涵思雨梓轩博文昊然宁悦瑶晓峰斌晶倩鑫亮健帆毅航宏云彤璐琪';

/** 中文人名：两三个字。 */
export const person = (): Field<string> => (_, rand) => () =>
  choose(rand, [...SURNAMES]) + Array.from({ length: rand() < 0.7 ? 2 : 1 }, () => choose(rand, [...GIVEN])).join('');

const CITIES = ['杭州', '上海', '苏州', '深圳', '广州', '成都', '武汉', '南京', '宁波', '合肥', '厦门', '青岛', '西安', '长沙', '天津'];
const WORDS = ['恒信', '华通', '启明', '远航', '盛达', '鼎新', '博源', '瑞丰', '中和', '天合', '润泽', '同创', '嘉禾', '安达', '凯越', '众联'];
const TRADES = ['科技', '贸易', '物流', '供应链', '电子', '包装', '食品', '机械', '纺织', '新材料'];

/** 机构名：杭州恒信科技有限公司。 */
export const org = (): Field<string> => (_, rand) => () => `${choose(rand, CITIES)}${choose(rand, WORDS)}${choose(rand, TRADES)}${rand() < 0.8 ? '有限公司' : '股份有限公司'}`;

const pad2 = (x: number) => String(x).padStart(2, '0');

/** 日期：date('2026-09-01', '2026-10-19') → 2026-09-17；{ time: true } 时带时分（08:00–21:59）。 */
export const date = (from: string, to: string, opts: { time?: boolean } = {}): Field<string> => (_, rand) => {
  const start = Date.parse(from + 'T00:00:00Z');
  const days = Math.round((Date.parse(to + 'T00:00:00Z') - start) / 86_400_000);
  return () => {
    const d = new Date(start + between(rand, 0, days) * 86_400_000);
    const day = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    return opts.time ? `${day} ${pad2(between(rand, 8, 21))}:${pad2(between(rand, 0, 59))}` : day;
  };
};

/** 金额，两位小数。 */
export const amount = (min: number, max: number): Field<number> => (_, rand) => () => Math.round((min + rand() * (max - min)) * 100) / 100;

/** 整数，含两端。 */
export const int = (min: number, max: number): Field<number> => (_, rand) => () => between(rand, min, max);

const PHRASES = ['按合同约定', '本周内完成', '请财务复核', '数量与订单一致', '已电话确认', '加急处理', '质检合格', '等待对方回复', '附件已上传', '按上月单价结算', '分两批到货', '发票随货寄出', '需要主管审批', '库存不足部分延期'];

/** 中文短文本，由不重复的短语拼成，长度在 min 到 max 个字之间（短语都比 min 长时取一个短语截到 max）。 */
export const text = (min: number, max: number): Field<string> => (_, rand) => () => {
  const target = between(rand, min, max);
  let s = '';
  for (const p of shuffle([...PHRASES], rand)) {
    const next = s ? `${s}，${p}` : p;
    if (next.length <= max) s = next;
    if (s.length >= target) break;
  }
  return s.length >= min ? s : shuffle([...PHRASES], rand).join('，').slice(0, target);
};

/** 常用的边界值，配合 withEdges 用。 */
export const EDGE = {
  longName: '华东大区（含江浙沪皖）2026 年第四季度重点客户订单履约与退款原因综合分析',
  longText: '这是一段很长的备注，用来检查表格和详情里的换行与截断：'.repeat(4),
  huge: 9_876_543_210.55,
};

/**
 * 把边界样例放到固定位置：第 k 个覆盖项写进第 2k+2 条（第 2、4、6…条，默认每页 10 条时都在第一页）。
 * 覆盖项只改写出来的字段，其余照旧。
 */
export function withEdges<T>(list: T[], edges: Partial<T>[]): T[] {
  const out = list.map((r) => ({ ...r }));
  edges.forEach((edge, k) => {
    const at = Math.min(2 * k + 1, out.length - 1);
    if (at >= 0) out[at] = { ...out[at], ...edge };
  });
  return out;
}
