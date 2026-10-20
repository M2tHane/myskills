/**
 * 常用图表的 option 生成函数。页面里优先用这些函数，而不是手写 ECharts option，
 * 这样配色顺序、提示框、坐标轴、图例、标注方式在所有图上保持一致。
 *
 * 规则（与 DESIGN.md「图表」一节一致）：
 * - 分类色按 chart-1 → chart-8 的固定顺序分配给系列，颜色跟着实体走；第 9 个系列起合并为「其他」。
 * - 一个系列不显示图例（卡片标题已说明）；两个及以上必须有图例。
 * - 双坐标轴只用 comboChart（左轴柱、右轴线），两侧网格线对齐；其他图不做双轴。
 * - 数值标签只标重点：条形图末端、单条折线的终点；不在每个点上写数字。
 */
import type { EChartsCoreOption } from 'echarts/core';
import { compact, percent, tokens, tooltipHTML, type ValueFormat } from './echarts';

export interface SeriesInput {
  name: string;
  data: Array<number | null>;
  /** 固定颜色序号 1–8（同一实体在不同图里保持同色）。不填时按出现顺序分配。 */
  slot?: number;
}

const colorOf = (s: SeriesInput, i: number) => tokens().series[((s.slot ?? i + 1) - 1) % 8];
const legend = (n: number, extra: object = {}) => (n > 1 ? { show: true, type: 'scroll', ...extra } : { show: false });
const top = (n: number) => (n > 1 ? 40 : 12);
/** 固定纵轴文字区宽度：上下联动的两张图传同一个值，横轴才能对齐。 */
const gridLeft = (w?: number) => (w ? { left: w, bottom: 26, outerBoundsMode: 'none' } : {});

function axisTooltip(format: ValueFormat, marker: 'dot' | 'line', total?: boolean) {
  return {
    trigger: 'axis' as const,
    axisPointer: { type: marker === 'line' ? ('line' as const) : ('shadow' as const) },
    formatter: (ps: unknown) => {
      const arr = (Array.isArray(ps) ? ps : [ps]) as Array<{ axisValueLabel: string; seriesName: string; value: number | null; color: string }>;
      const rows = arr.map((p) => ({ name: p.seriesName, value: p.value == null ? '—' : format(p.value), color: p.color, marker }));
      const sum = arr.reduce((a, p) => a + (p.value ?? 0), 0);
      return tooltipHTML(arr[0]?.axisValueLabel ?? '', rows, total && arr.length > 1 ? `合计 ${format(sum)}` : undefined);
    },
  };
}

/* -------------------------------------------------------------------- line */

export interface LineChartInput {
  categories: string[];
  series: SeriesInput[];
  /** 单系列时加 8% 透明度的面积底色。 */
  area?: boolean;
  /** 灰色对比线（如上期、去年同期），画在最底层。 */
  compare?: SeriesInput;
  /** 单系列时在终点标出数值。 */
  endLabel?: boolean;
  format?: ValueFormat;
  /** 纵轴从 0 开始（默认）；比率类小幅波动可设为 false。 */
  zero?: boolean;
  /** 纵轴文字区宽度（px）。联动的上下两张图设成相同值以对齐横轴。 */
  axisWidth?: number;
}

export function lineChart({ categories, series, area, compare, endLabel, format = compact, zero = true, axisWidth }: LineChartInput): EChartsCoreOption {
  const t = tokens();
  const end = endLabel && series.length === 1;
  const lines = series.map((s, i) => {
    const c = colorOf(s, i);
    return {
      type: 'line', name: s.name, data: s.data, color: c, z: 3,
      lineStyle: { color: c, width: 2 },
      itemStyle: { color: c, borderColor: t.surface, borderWidth: 2 },
      areaStyle: area && series.length === 1 ? { color: c, opacity: 0.08 } : undefined,
      endLabel: end ? { show: true, formatter: (p: { value: number }) => format(p.value), color: t.fg, fontSize: 12, fontWeight: 500, distance: 8 } : undefined,
      connectNulls: false,
    };
  });
  const cmp = compare ? [{
    type: 'line', name: compare.name, data: compare.data, color: t.muted, z: 2,
    lineStyle: { color: t.muted, width: 2 }, itemStyle: { color: t.muted, borderColor: t.surface, borderWidth: 2 },
  }] : [];
  const n = series.length + cmp.length;
  return {
    grid: { top: top(n), right: end ? 56 : 8, ...gridLeft(axisWidth) },
    legend: legend(n),
    tooltip: axisTooltip(format, 'line'),
    xAxis: { type: 'category', data: categories, boundaryGap: false },
    yAxis: { type: 'value', scale: !zero, axisLabel: { formatter: (v: number) => format(v) } },
    series: [...cmp, ...lines],
  };
}

/* --------------------------------------------------------------------- bar */

export interface BarChartInput {
  categories: string[];
  series: SeriesInput[];
  /** 堆叠（各段之间留 2px 白缝，只有最上一段有圆角）。 */
  stack?: boolean;
  /** 横向条形。类目名较长或超过 12 个时用。 */
  horizontal?: boolean;
  /** 单系列强调：其余柱为灰色，只有这一根是蓝色。'last' 表示最后一根（当前期）。 */
  highlight?: number | 'last';
  /** 灰色对比系列（上期、去年同期），排在每组最前面。当前期用 series。 */
  compare?: SeriesInput;
  format?: ValueFormat;
  /** 纵轴文字区宽度（px），用法同 lineChart。 */
  axisWidth?: number;
}

export function barChart({ categories, series, stack, horizontal, highlight, compare, format = compact, axisWidth }: BarChartInput): EChartsCoreOption {
  const t = tokens();
  const single = series.length === 1;
  const hi = highlight === 'last' ? categories.length - 1 : highlight;
  const rTop = horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  const bars = series.map((s, i) => {
    const c = colorOf(s, i);
    const isTop = !stack || i === series.length - 1;
    const data = single && hi != null
      ? s.data.map((v, k) => ({ value: v, itemStyle: { color: k === hi ? c : t.muted }, emphasis: { itemStyle: { color: k === hi ? c : t.mutedHover } } }))
      : s.data;
    return {
      type: 'bar', name: s.name, data, color: c, stack: stack ? 'total' : undefined,
      itemStyle: { color: c, borderRadius: isTop ? rTop : 0, ...(stack ? { borderColor: t.surface, borderWidth: 1 } : {}) },
      barGap: '16%', barCategoryGap: (series.length > 1 || compare) && !stack ? '36%' : '40%',
    };
  });
  const cmp = compare && !stack ? [{
    type: 'bar', name: compare.name, data: compare.data, color: t.muted,
    itemStyle: { color: t.muted, borderRadius: rTop }, emphasis: { itemStyle: { color: t.mutedHover } },
    barGap: '16%', barCategoryGap: '36%',
  }] : [];
  const all = [...cmp, ...bars];
  const cat = { type: 'category', data: categories };
  const val = { type: 'value', axisLabel: { formatter: (v: number) => format(v) } };
  return {
    grid: { top: top(all.length), ...gridLeft(axisWidth) },
    legend: legend(all.length),
    tooltip: axisTooltip(format, 'dot', stack),
    xAxis: horizontal ? val : cat,
    yAxis: horizontal ? { ...cat, inverse: true } : val,
    series: all,
  };
}

/* ----------------------------------------------------------------- ranking */

export interface RankingInput {
  items: Array<{ name: string; value: number }>;
  /** 最多显示几项，其余不显示（默认 10）。 */
  limit?: number;
  /** 强调某一项（名称），其余变灰。 */
  highlight?: string;
  format?: ValueFormat;
}

/** 排名条形图：从大到小，数值标在条形末端，不显示数值轴和网格。 */
export function rankingChart({ items, limit = 10, highlight, format = compact }: RankingInput): EChartsCoreOption {
  const t = tokens();
  const rows = [...items].sort((a, b) => b.value - a.value).slice(0, limit);
  const c = t.series[0];
  return {
    grid: { top: 4, right: 64, bottom: 4, left: 0 },
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; color: string }) => tooltipHTML(null, [{ name: p.name, value: format(p.value), color: p.color }]),
    },
    xAxis: { type: 'value', show: false, max: (m: { max: number }) => m.max },
    yAxis: { type: 'category', inverse: true, data: rows.map((r) => r.name), axisLine: { show: false }, axisLabel: { color: t.fgMuted, fontSize: 12, margin: 12 } },
    series: [{
      type: 'bar', barWidth: 12, barMaxWidth: 12,
      data: rows.map((r) => ({ value: r.value, itemStyle: { color: highlight && r.name !== highlight ? t.muted : c } })),
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      showBackground: true, backgroundStyle: { color: t.hover, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', distance: 8, color: t.fg, fontSize: 12, fontWeight: 500, formatter: (p: { value: number }) => format(p.value) },
    }],
  };
}

/* ------------------------------------------------------------------- donut */

export interface DonutInput {
  items: Array<{ name: string; value: number; slot?: number }>;
  /** 中心标题，默认「合计」。 */
  label?: string;
  format?: ValueFormat;
  /** 超过多少项时把末尾合并为「其他」（默认 6）。 */
  max?: number;
}

/** 环形图：只用于一眼看占比，最多 6 段；卡片宽度不小于 400px；数值接近、需要精确比较时改用条形图。图例在右侧，列出数值和占比。 */
export function donutChart({ items, label = '合计', format = compact, max = 6 }: DonutInput): EChartsCoreOption {
  const t = tokens();
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, sorted.length > max ? max - 1 : max);
  const tail = sorted.slice(head.length);
  const rows = tail.length ? [...head, { name: '其他', value: tail.reduce((a, b) => a + b.value, 0), slot: 0 }] : head;
  const total = rows.reduce((a, b) => a + b.value, 0);
  const data = rows.map((r, i) => ({ name: r.name, value: r.value, itemStyle: { color: r.slot === 0 ? t.muted : t.series[((r.slot ?? i + 1) - 1) % 8] } }));
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.value]));
  return {
    title: {
      text: format(total), subtext: label, left: '27%', top: 'center', textAlign: 'center', itemGap: 2,
      textStyle: { color: t.fg, fontSize: 20, fontWeight: 600, fontFamily: t.font, lineHeight: 26 },
      subtextStyle: { color: t.fgSubtle, fontSize: 12, fontFamily: t.font },
    },
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; color: string; percent: number }) =>
        tooltipHTML(null, [{ name: p.name, value: `${format(p.value)} · ${p.percent.toFixed(1)}%`, color: p.color }]),
    },
    legend: {
      show: true, orient: 'vertical', left: '55%', top: 'middle', itemGap: 12, icon: 'roundRect',
      formatter: (name: string) => `{n|${name}}{v|${format(byName[name])}}{p|${percent(byName[name] / total)}}`,
      textStyle: {
        rich: {
          n: { width: 56, color: t.fgMuted, fontSize: 12, fontFamily: t.font },
          v: { width: 56, align: 'right', color: t.fg, fontSize: 12, fontWeight: 500, fontFamily: t.font },
          p: { width: 44, align: 'right', color: t.fgSubtle, fontSize: 12, fontFamily: t.font },
        },
      },
    },
    series: [{
      type: 'pie', radius: ['50%', '72%'], center: ['27%', '50%'], data, avoidLabelOverlap: true,
      label: { show: false }, labelLine: { show: false },
      itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 3 },
      emphasis: { scale: true, scaleSize: 4, label: { show: false } },
    }],
  };
}

/* ----------------------------------------------------------------- scatter */

export interface ScatterInput {
  /** 最多 3 个系列（任意两点都可能相邻，超过 3 种颜色难以分清）。 */
  series: Array<{ name: string; data: Array<[number, number]>; slot?: number }>;
  xName: string;
  yName: string;
  xFormat?: ValueFormat;
  yFormat?: ValueFormat;
}

export function scatterChart({ series, xName, yName, xFormat = compact, yFormat = compact }: ScatterInput): EChartsCoreOption {
  const t = tokens();
  return {
    grid: { top: top(series.length) + 16, right: 16, bottom: 26 },
    legend: legend(series.length),
    tooltip: {
      trigger: 'item',
      formatter: (p: { seriesName: string; value: [number, number]; color: string }) =>
        tooltipHTML(p.seriesName, [{ name: xName, value: xFormat(p.value[0]) }, { name: yName, value: yFormat(p.value[1]) }]),
    },
    xAxis: {
      type: 'value', name: xName, nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: t.fgSubtle, fontSize: 11 },
      axisLine: { show: true, lineStyle: { color: t.axis } }, splitLine: { show: false }, axisLabel: { formatter: (v: number) => xFormat(v) },
    },
    yAxis: { type: 'value', name: yName, nameLocation: 'end', nameGap: 12, nameTextStyle: { color: t.fgSubtle, fontSize: 11, align: 'left' }, axisLabel: { formatter: (v: number) => yFormat(v) } },
    series: series.slice(0, 3).map((s, i) => {
      const c = t.series[((s.slot ?? i + 1) - 1) % 8];
      return { type: 'scatter', name: s.name, data: s.data, color: c, symbolSize: 8, itemStyle: { color: c, borderColor: t.surface, borderWidth: 1.5, opacity: 0.9 }, emphasis: { scale: 1.4 } };
    }),
  };
}

/* ----------------------------------------------------------------- heatmap */

export interface HeatmapInput {
  x: string[];
  y: string[];
  /** [x 下标, y 下标, 数值] */
  data: Array<[number, number, number]>;
  format?: ValueFormat;
}

/** 热力图：单一蓝色色阶，浅 = 少，深 = 多；色阶图例在右上角。 */
export function heatmapChart({ x, y, data, format = compact }: HeatmapInput): EChartsCoreOption {
  const t = tokens();
  const vals = data.map((d) => d[2]);
  return {
    grid: { top: 36, right: 0, bottom: 0, left: 0 },
    tooltip: {
      trigger: 'item',
      formatter: (p: { value: [number, number, number]; color: string }) => tooltipHTML(`${y[p.value[1]]} · ${x[p.value[0]]}`, [{ name: '数值', value: format(p.value[2]), color: p.color }]),
    },
    xAxis: { type: 'category', data: x, axisLine: { show: false }, splitArea: { show: false } },
    yAxis: { type: 'category', data: y, inverse: true, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: t.label, fontSize: 11 } },
    visualMap: {
      type: 'continuous', min: Math.min(...vals), max: Math.max(...vals), calculable: false, orient: 'horizontal', right: 0, top: 0,
      itemWidth: 10, itemHeight: 120, text: [format(Math.max(...vals)), format(Math.min(...vals))], textGap: 8,
      textStyle: { color: t.fgSubtle, fontSize: 11 }, inRange: { color: t.seq },
    },
    series: [{ type: 'heatmap', data, itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 3 }, emphasis: { itemStyle: { borderColor: t.fg, borderWidth: 1 } } }],
  };
}

/* ------------------------------------------------------------------ funnel */

export interface FunnelInput {
  stages: Array<{ name: string; value: number }>;
  format?: ValueFormat;
}

/** 漏斗：阶段有先后，用有序色阶（同一蓝色从深到浅，最多 5 档）；右侧标出数值和相对上一步的转化率。 */
export function funnelChart({ stages, format = compact }: FunnelInput): EChartsCoreOption {
  const t = tokens();
  const ramp = t.ord;
  const data = stages.map((s, i) => ({ name: s.name, value: s.value, itemStyle: { color: ramp[Math.min(i, ramp.length - 1)] } }));
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; dataIndex: number; color: string }) => {
        const prev = p.dataIndex > 0 ? stages[p.dataIndex - 1].value : null;
        return tooltipHTML(p.name, [
          { name: '数量', value: format(p.value), color: p.color },
          ...(prev ? [{ name: '较上一步', value: percent(p.value / prev) }] : []),
          { name: '较第一步', value: percent(p.value / stages[0].value) },
        ]);
      },
    },
    series: [{
      type: 'funnel', left: 0, right: '48%', top: 4, bottom: 4, sort: 'none', gap: 2, minSize: '24%', funnelAlign: 'center',
      itemStyle: { borderColor: t.surface, borderWidth: 0 },
      label: {
        show: true, position: 'right', distance: 0,
        formatter: (p: { name: string; value: number; dataIndex: number }) => {
          const prev = p.dataIndex > 0 ? stages[p.dataIndex - 1].value : null;
          return `{n|${p.name}}{v|${format(p.value)}}${prev ? `{r|${percent(p.value / prev)}}` : '{r|}'}`;
        },
        rich: {
          n: { width: 72, color: t.fgMuted, fontSize: 12, padding: [0, 0, 0, 8], fontFamily: t.font },
          v: { width: 56, align: 'right', color: t.fg, fontSize: 12, fontWeight: 500, fontFamily: t.font },
          r: { width: 52, align: 'right', color: t.fgSubtle, fontSize: 12, fontFamily: t.font },
        },
      },
      labelLine: { show: true, length: 12, lineStyle: { color: t.border, width: 1 } },
      emphasis: { label: { fontSize: 12 } },
      data,
    }],
  };
}

/* ------------------------------------------------------------------- combo */

const niceStep = (raw: number) => {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 3, 5, 10].map((k) => k * p).find((k) => k >= raw) ?? 10 * p;
};
/** 把 [lo, hi] 扩成整齐刻度。n 不给时在 4–6 段里挑最贴合数据的一种。 */
function niceAxis(lo: number, hi: number, n?: number, zero = true, candidates = [4, 5, 6]) {
  const fit = (k: number) => {
    const base = zero ? Math.min(0, lo) : lo;
    const step = niceStep((hi - base) / k);
    const min = zero && lo >= 0 ? 0 : Math.floor(lo / step) * step;
    let segs = k;
    while (min + step * segs < hi) segs += 1;
    return { min, max: min + step * segs, interval: step, splitNumber: segs };
  };
  if (n) return fit(n);
  return candidates.map(fit).sort((a, b) => a.max - a.min - (b.max - b.min) || a.splitNumber - b.splitNumber)[0];
}

export interface ComboChartInput {
  categories: string[];
  /** 柱：左侧纵轴。通常 1 个系列，最多 2 个。 */
  bars: SeriesInput[];
  /** 线：右侧纵轴，1 个系列。 */
  line: SeriesInput;
  barFormat?: ValueFormat;
  lineFormat?: ValueFormat;
  /** 右轴从 0 开始。比率类小幅波动保持 false（默认）。 */
  lineZero?: boolean;
}

/**
 * 柱线组合：左轴是柱（量），右轴是线（率或另一单位）。
 * 柱画在下半区、线画在上半区，互不遮挡；两侧共用一套网格线，每侧只标出自己数据范围内的刻度；
 * 两条轴顶部写上各自的系列名，图例同时说明颜色。
 */
export function comboChart({ categories, bars, line, barFormat = compact, lineFormat = compact, lineZero = false }: ComboChartInput): EChartsCoreOption {
  const t = tokens();
  const bv = bars.flatMap((b) => b.data).filter((v): v is number => v != null);
  const lv = line.data.filter((v): v is number => v != null);
  // 上下分区：柱占下面 k1 段，线占上面 k2 段，线始终画在柱的上方；两侧共用同一套网格线。
  const bars0 = niceAxis(Math.min(...bv), Math.max(...bv), undefined, true, [3, 4]);
  const line0 = niceAxis(Math.min(...lv), Math.max(...lv), undefined, lineZero, [2, 3]);
  const k1 = bars0.splitNumber, k2 = line0.splitNumber, total = k1 + k2;
  const left = { min: bars0.min, max: bars0.min + bars0.interval * total, interval: bars0.interval, top: bars0.max };
  const right = { min: line0.min - line0.interval * k1, max: line0.max, interval: line0.interval, bottom: line0.min };
  const eps = (x: number) => Math.abs(x) * 1e-9 + 1e-12;
  // 每侧只标自己数据范围内的刻度
  const leftLabel = (v: number) => (v <= left.top + eps(left.top) ? barFormat(v) : '');
  const rightLabel = (v: number) => (v >= right.bottom - eps(right.bottom) ? lineFormat(v) : '');
  const lineColor = colorOf(line, bars.length);
  const name = (n: string, align: 'left' | 'right') => ({ name: n, nameLocation: 'end' as const, nameGap: 12, nameTextStyle: { color: t.fgSubtle, fontSize: 11, align } });
  return {
    grid: { top: 56, right: 0 },
    legend: { show: true, type: 'scroll' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (ps: unknown) => {
        const arr = ps as Array<{ axisValueLabel: string; seriesName: string; value: number | null; color: string; seriesType: string }>;
        return tooltipHTML(arr[0]?.axisValueLabel ?? '', arr.map((p) => ({
          name: p.seriesName, color: p.color, marker: p.seriesType === 'line' ? 'line' : 'dot',
          value: p.value == null ? '—' : p.seriesType === 'line' ? lineFormat(p.value) : barFormat(p.value),
        })));
      },
    },
    xAxis: { type: 'category', data: categories },
    yAxis: [
      { type: 'value', ...name(bars.map((b) => b.name).join(' / '), 'left'), min: left.min, max: left.max, interval: left.interval, axisLabel: { formatter: leftLabel } },
      { type: 'value', ...name(line.name, 'right'), position: 'right', min: right.min, max: right.max, interval: right.interval, splitLine: { show: false }, axisLabel: { formatter: rightLabel } },
    ],
    series: [
      ...bars.map((b, i) => {
        const c = colorOf(b, i);
        return { type: 'bar', name: b.name, data: b.data, yAxisIndex: 0, color: c, itemStyle: { color: c, borderRadius: [4, 4, 0, 0] }, barGap: '16%', barCategoryGap: bars.length > 1 ? '36%' : '40%' };
      }),
      {
        type: 'line', name: line.name, data: line.data, yAxisIndex: 1, color: lineColor, z: 4,
        lineStyle: { color: lineColor, width: 2 }, symbol: 'circle', symbolSize: 8, showSymbol: true,
        itemStyle: { color: lineColor, borderColor: t.surface, borderWidth: 2 },
      },
    ],
  };
}
