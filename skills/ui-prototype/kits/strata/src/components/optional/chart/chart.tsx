import * as React from 'react';
import type { EChartsCoreOption, ECharts, SetOptionOpts } from 'echarts/core';
import { cn } from '@/lib/utils';
import { echarts, ensureTheme, THEME_NAME, tokens } from './echarts';

export interface ChartProps {
  /** ECharts option。优先用 presets 里的 lineChart / barChart 等生成，保持样式一致。 */
  option: EChartsCoreOption;
  /** 绘图区高度（含坐标轴文字），默认 280。 */
  height?: number;
  /** 首次加载显示骨架；已有图形时再次加载，保留旧图并降低不透明度，不闪烁。 */
  loading?: boolean;
  /** 没有数据时显示的内容，默认「暂无数据」。传入时不渲染图形。 */
  empty?: boolean | React.ReactNode;
  /** 少于约 5000 个点用 svg（默认，线条更清晰）；点很多时用 canvas。 */
  renderer?: 'svg' | 'canvas';
  /** 同组图表联动提示框（如共享横轴的上下两图）。 */
  group?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  /** 读屏用的图表描述。 */
  ariaLabel?: string;
  className?: string;
  /** 拿到 ECharts 实例（如需 dispatchAction）。 */
  onReady?: (chart: ECharts) => void;
  setOptionOpts?: SetOptionOpts;
}

export function Chart({ option, height = 280, loading, empty, renderer = 'svg', group, onEvents, ariaLabel, className, onReady, setOptionOpts }: ChartProps) {
  const el = React.useRef<HTMLDivElement>(null);
  const chart = React.useRef<ECharts | null>(null);
  const [drawn, setDrawn] = React.useState(false);
  const isEmpty = !!empty && !loading;

  React.useEffect(() => {
    if (!el.current || isEmpty) return;
    ensureTheme();
    const c = echarts.init(el.current, THEME_NAME, { renderer, locale: 'ZH' });
    chart.current = c;
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current);
    return () => { ro.disconnect(); c.dispose(); chart.current = null; setDrawn(false); };
  }, [renderer, isEmpty]);

  React.useEffect(() => {
    const c = chart.current;
    if (!c || isEmpty || (loading && !drawn)) return;
    c.setOption({ aria: { enabled: true, label: ariaLabel ? { description: ariaLabel } : undefined }, ...option }, { notMerge: true, ...setOptionOpts });
    if (!drawn) { setDrawn(true); onReady?.(c); }
  }, [option, isEmpty, loading, drawn, ariaLabel, setOptionOpts, onReady]);

  React.useEffect(() => {
    const c = chart.current;
    if (!c || !onEvents) return;
    for (const [k, fn] of Object.entries(onEvents)) c.on(k, fn);
    return () => { for (const [k, fn] of Object.entries(onEvents)) c.off(k, fn); };
  }, [onEvents, drawn]);

  React.useEffect(() => {
    const c = chart.current;
    if (!c || !group) return;
    c.group = group;
    echarts.connect(group);
  }, [group, drawn]);

  const t = tokens();
  return (
    <div className={cn(className)} style={{ position: 'relative', width: '100%', height }} aria-busy={loading || undefined}>
      {!isEmpty && (
        <div ref={el} role="img" aria-label={ariaLabel}
          style={{ position: 'absolute', inset: 0, opacity: loading && drawn ? 0.45 : 1, transition: 'opacity 160ms ease-out' }} />
      )}
      {loading && !drawn && <ChartSkeleton />}
      {isEmpty && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgSubtle, fontSize: 13 }}>
          {empty === true ? '暂无数据' : empty}
        </div>
      )}
    </div>
  );
}

/** 首次加载：灰色柱形骨架 + 网格线，高度与真实图形一致。 */
function ChartSkeleton() {
  const hs = [46, 62, 54, 70, 58, 78, 66, 84, 72, 60, 76, 88];
  return (
    <div style={{ position: 'absolute', inset: '40px 8px 26px 36px', display: 'flex', alignItems: 'flex-end', gap: '3%' }}>
      {hs.map((h, i) => (
        <span key={i} className="animate-skeleton"
          style={{ flex: 1, maxWidth: 24, height: `${h}%`, borderRadius: '4px 4px 0 0', background: 'var(--surface-active)' }} />
      ))}
    </div>
  );
}
