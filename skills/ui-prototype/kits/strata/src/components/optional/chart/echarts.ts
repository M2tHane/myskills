/**
 * Strata × ECharts：按需注册图表模块，并从 theme.css 的 token 生成 ECharts 主题。
 * 依赖 echarts@6.1.0。颜色、字体、阴影都在运行时从 theme.css 的 CSS 变量读取，不写死任何颜色。
 */
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, HeatmapChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  AriaComponent, DatasetComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent,
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, FunnelChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, MarkLineComponent, DatasetComponent, AriaComponent, TitleComponent,
  LabelLayout, SVGRenderer, CanvasRenderer,
]);

export { echarts };

/* ------------------------------------------------------------------ tokens */


export interface StrataChartTokens {
  series: string[];
  muted: string; mutedHover: string; grid: string; axis: string; label: string;
  seq: string[]; ord: string[]; divNeg: string; divMid: string;
  surface: string; raised: string; hover: string; border: string; borderStrong: string;
  fg: string; fgMuted: string; fgSubtle: string; success: string; warning: string; danger: string;
  shadow: string;
  font: string;
}

/** 读取 theme.css 的 CSS 变量（会解析 var() 链）。页面必须已引入 theme.css。 */
export function readTokens(el: Element = document.documentElement): StrataChartTokens {
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  const font = v('--font-sans-stack') || v('--font-sans') || 'system-ui, sans-serif';
  return {
    series: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => v(`--chart-${i}`)),
    muted: v('--chart-muted'), mutedHover: v('--chart-muted-hover'), grid: v('--chart-grid'), axis: v('--chart-axis'), label: v('--chart-label'),
    seq: [1, 2, 3, 4, 5, 6, 7].map((i) => v(`--chart-seq-${i}`)), ord: [1, 2, 3, 4, 5].map((i) => v(`--chart-ord-${i}`)), divNeg: v('--chart-div-neg'), divMid: v('--chart-div-mid'),
    surface: v('--surface'), raised: v('--surface-raised'), hover: v('--surface-hover'), border: v('--border'), borderStrong: v('--border-strong'),
    fg: v('--fg'), fgMuted: v('--fg-muted'), fgSubtle: v('--fg-subtle'), success: v('--success'), warning: v('--warning'), danger: v('--danger'),
    shadow: v('--shadow-raised'),
    font,
  };
}

let cached: StrataChartTokens | null = null;
/** 当前 token（首次调用时读取并缓存；改了 theme.css 变量后调用 refreshStrataTheme）。 */
export function tokens(): StrataChartTokens {
  if (!cached) cached = readTokens();
  return cached;
}

/* -------------------------------------------------------------- formatters */

const nf = (d: number) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const MINUS = '−';
const sign = (v: number, s: string) => (v < 0 ? MINUS + s.replace('-', '') : s);

/** 1,284 · 12.8万 · 3.6亿。坐标轴刻度和指标值都用它。 */
export function compact(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e8) return sign(v, nf(digits).format(a / 1e8) + '亿');
  if (a >= 1e4) return sign(v, nf(digits).format(a / 1e4) + '万');
  return sign(v, nf(a < 10 && a % 1 ? 2 : 0).format(a));
}
/** 千分位整数或小数：401,722 · 4,826,310.50 */
export function number(v: number | null | undefined, digits = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  return sign(v, new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v)));
}
/** 0.124 → 12.4% */
export function percent(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  return sign(v, (Math.abs(v) * 100).toFixed(digits) + '%');
}

export const fmt = { compact, number, percent };
export type ValueFormat = (v: number) => string;

/* ----------------------------------------------------------------- tooltip */

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface TooltipRow { name: string; value: string; color?: string; marker?: 'dot' | 'line'; strong?: boolean }

/** Strata 浅色提示框：标题一行，下面每行「色块 · 名称 · 右对齐数值」。 */
export function tooltipHTML(title: string | null, rows: TooltipRow[], foot?: string): string {
  const t = tokens();
  const mk = (r: TooltipRow) => r.color
    ? r.marker === 'line'
      ? `<span style="display:inline-block;width:10px;height:2px;border-radius:1px;background:${r.color}"></span>`
      : `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${r.color}"></span>`
    : '';
  const head = title ? `<div style="font-size:12px;line-height:16px;color:${t.fgMuted};margin:0 0 6px">${esc(title)}</div>` : '';
  const body = rows.map((r) => `<div style="display:flex;align-items:center;gap:8px;font-size:12px;line-height:20px">`
    + `<span style="display:inline-flex;width:10px;justify-content:center">${mk(r)}</span>`
    + `<span style="color:${t.fgMuted};flex:1;min-width:0;white-space:nowrap">${esc(r.name)}</span>`
    + `<span style="color:${t.fg};font-weight:${r.strong ? 600 : 500};font-variant-numeric:tabular-nums;margin-left:16px">${esc(r.value)}</span></div>`).join('');
  const f = foot ? `<div style="border-top:1px solid ${t.border};margin:6px 0 0;padding:6px 0 0;font-size:12px;line-height:16px;color:${t.fgSubtle}">${esc(foot)}</div>` : '';
  return head + body + f;
}

/* ------------------------------------------------------------------- theme */

export const THEME_NAME = 'strata';

export function buildTheme(t: StrataChartTokens = tokens()) {
  const axisLabel = { color: t.label, fontSize: 11, lineHeight: 16, margin: 10, fontFamily: t.font };
  const category = {
    axisLine: { show: true, lineStyle: { color: t.axis, width: 1 } },
    axisTick: { show: false },
    axisLabel,
    splitLine: { show: false },
    splitArea: { show: false },
  };
  const value = {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...axisLabel, formatter: (v: number) => compact(v) },
    splitLine: { show: true, lineStyle: { color: t.grid, width: 1, type: 'solid' } },
    splitArea: { show: false },
    splitNumber: 4,
    nameTextStyle: { color: t.fgSubtle, fontSize: 11, fontFamily: t.font },
  };
  return {
    color: t.series,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: t.font, color: t.fgMuted, fontSize: 12 },
    animationDuration: 320,
    animationDurationUpdate: 240,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    grid: { left: 0, right: 8, top: 40, bottom: 0, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    categoryAxis: category,
    valueAxis: value,
    timeAxis: category,
    logAxis: value,
    legend: {
      top: 0, left: 0, itemGap: 16, itemWidth: 8, itemHeight: 8, icon: 'roundRect',
      textStyle: { color: t.fgMuted, fontSize: 12, fontFamily: t.font, padding: [0, 0, 0, 2] },
      inactiveColor: t.muted, inactiveBorderColor: t.muted,
      pageIconColor: t.fgMuted, pageIconInactiveColor: t.muted, pageTextStyle: { color: t.fgSubtle },
    },
    tooltip: {
      backgroundColor: t.raised,
      borderColor: t.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: t.fg, fontSize: 12, fontFamily: t.font },
      extraCssText: `border-radius:8px;box-shadow:${t.shadow};`,
      axisPointer: {
        lineStyle: { color: t.borderStrong, width: 1, type: 'solid' },
        crossStyle: { color: t.borderStrong, width: 1, type: 'solid' },
        shadowStyle: { color: t.hover, opacity: 1 },
        label: { show: false },
        z: 0,
      },
      confine: true,
      transitionDuration: 0.12,
    },
    axisPointer: { z: 0, lineStyle: { color: t.borderStrong, width: 1, type: 'solid' } },
    line: {
      lineStyle: { width: 2, cap: 'round', join: 'round' },
      symbol: 'circle', symbolSize: 8, showSymbol: false,
      itemStyle: { borderWidth: 2, borderColor: t.surface },
      emphasis: { focus: 'none', scale: false, lineStyle: { width: 2 } },
      smooth: false,
    },
    bar: {
      barMaxWidth: 24,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      emphasis: { focus: 'none' },
    },
    pie: { itemStyle: { borderColor: t.surface, borderWidth: 2 } },
    scatter: { symbolSize: 8, itemStyle: { borderColor: t.surface, borderWidth: 1.5, opacity: 0.9 } },
    heatmap: { itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 2 } },
    funnel: { itemStyle: { borderColor: t.surface, borderWidth: 2 } },
    visualMap: { textStyle: { color: t.fgSubtle, fontSize: 11 }, itemWidth: 10, itemHeight: 120 },
    markLine: { symbol: 'none', lineStyle: { color: t.fgSubtle, width: 1, type: 'solid' }, label: { color: t.fgMuted, fontSize: 11 } },
  };
}

let registered = false;
export function ensureTheme() {
  if (registered) return;
  echarts.registerTheme(THEME_NAME, buildTheme());
  registered = true;
}
/** 修改了 theme.css 的图表变量后调用，重新生成主题（已创建的图表需重新挂载）。 */
export function refreshStrataTheme() {
  cached = null;
  echarts.registerTheme(THEME_NAME, buildTheme());
  registered = true;
}
