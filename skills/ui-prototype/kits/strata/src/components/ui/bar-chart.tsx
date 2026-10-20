import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BarDatum { label: string; value: number }
export interface BarChartProps {
  data: BarDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Index drawn in primary (default: the last, i.e. the current period). History bars are gray. */
  highlight?: number;
  /** Show every n-th x label. */
  labelEvery?: number;
  className?: string;
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/**
 * Single-series bar chart. History in gray-300, the current period in primary — blue only where it matters.
 * Thin bars with 4px rounded tops on the baseline, 2px gaps, three recessive grid lines, hover tooltip per bar.
 */
export function BarChart({ data, height = 200, format = (v) => v.toLocaleString('zh-CN'), highlight, labelEvery = 5, className }: BarChartProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(600);
  const [hover, setHover] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const hl = highlight ?? data.length - 1;
  const left = 40, bottom = 22, top = 8;
  const max = niceMax(Math.max(...data.map((d) => d.value)) * 1.05);
  const ih = height - top - bottom, iw = Math.max(0, w - left);
  const slot = iw / data.length;
  const bw = Math.max(2, slot - 2);
  const y = (v: number) => top + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];
  return (
    <div ref={ref} className={cn('relative w-full font-sans', className)} style={{ height }}>
      <svg width={w} height={height} role="img" aria-label={data.map((d) => `${d.label} ${format(d.value)}`).join('，')} className="block overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={w} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--border)' : 'var(--border-subtle)'} />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--fg-subtle)" style={{ fontVariantNumeric: 'tabular-nums' }}>{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = left + i * slot + 1;
          const h = Math.max(0, top + ih - y(d.value));
          const r = Math.min(4, bw / 2, h);
          const yy = top + ih - h;
          const path = `M${x},${top + ih} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${top + ih} Z`;
          const fill = i === hl ? 'var(--primary)' : hover === i ? 'var(--gray-400)' : 'var(--gray-300)';
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={left + i * slot} y={top} width={slot} height={ih} fill="transparent" />
              <path d={path} fill={fill} />
              {i % labelEvery === 0 && <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--fg-subtle)">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <span className="pointer-events-none absolute z-[5] inline-flex -translate-x-1/2 -translate-y-full gap-1.5 whitespace-nowrap rounded-sm border border-border bg-surface-raised px-2 py-1 text-caption text-fg tabular-nums shadow-raised"
          style={{ left: left + hover * slot + slot / 2, top: y(data[hover].value) - 6 }}>
          <span className="text-fg-muted">{data[hover].label}</span><b className="font-semibold">{format(data[hover].value)}</b>
        </span>
      )}
    </div>
  );
}
