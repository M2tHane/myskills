import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SparklineProps { data: number[]; labels?: string[]; width?: number; height?: number; format?: (v: number) => string }

/** 12-point trend: history in gray-400, the current period and end point in primary. Hover shows values. */
export function Sparkline({ data, labels, width = 120, height = 36, format = (v) => v.toLocaleString('zh-CN') }: SparklineProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const last = data.length - 1;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, last);
  const y = (v: number) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const show = hover ?? last;
  return (
    <span className="relative inline-block shrink-0" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`趋势：${data.map(format).join('，')}`}
        className="block cursor-crosshair overflow-visible"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(last, Math.round(((e.clientX - r.left - pad) / (width - pad * 2)) * last)))); }}
        onMouseLeave={() => setHover(null)}>
        <polyline points={pts.slice(0, last).join(' ')} fill="none" stroke="var(--gray-400)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts.slice(last - 1).join(' ')} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={height} stroke="var(--border-strong)" strokeDasharray="2 2" />}
        <circle cx={x(show)} cy={y(data[show])} r={3} fill={show === last ? 'var(--primary)' : 'var(--gray-500)'} stroke="var(--surface)" strokeWidth={2} />
      </svg>
      {hover != null && (
        <span className="pointer-events-none absolute bottom-[calc(100%+6px)] z-[5] inline-flex -translate-x-1/2 gap-1.5 whitespace-nowrap rounded-sm border border-border bg-surface-raised px-2 py-1 text-caption text-fg tabular-nums shadow-raised"
          style={{ left: x(hover) }}>
          {labels?.[hover] && <span className="text-fg-muted">{labels[hover]}</span>}<b className="font-semibold">{format(data[hover])}</b>
        </span>
      )}
    </span>
  );
}

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** Signed change: “+12.4%”, “−0.3 s”. “—” when there is nothing to compare with (the previous period is 0): shown in gray without an arrow. */
  delta?: string;
  /** Whether the change is good news — colours the delta (耗时下降 = 绿，成功率下降 = 红). */
  deltaGood?: boolean;
  /** The period compared against: “较上周”. */
  compare?: React.ReactNode;
  trend?: number[];
  trendLabels?: string[];
  trendFormat?: (v: number) => string;
  className?: string;
}

/** KPI tile. At most four per row; no trend → no chart. */
export function StatCard({ label, value, unit, delta, deltaGood, compare, trend, trendLabels, trendFormat, className }: StatCardProps) {
  const down = delta ? /^[-−]/.test(delta.trim()) : false;
  const none = delta?.trim() === '—';
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 rounded-md border border-border bg-surface px-4 py-3.5 font-sans shadow-card', className)}>
      <div className="text-body-sm text-fg-muted">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="whitespace-nowrap text-num-lg font-semibold tracking-[-0.02em] text-fg">
          {value}{unit != null && <span className="ml-[3px] text-body-sm font-medium tracking-normal text-fg-subtle">{unit}</span>}
        </div>
        {trend && <Sparkline data={trend} labels={trendLabels} format={trendFormat} />}
      </div>
      {delta && (
        <div className="flex items-center gap-1.5 text-caption">
          <span className={cn('inline-flex items-center gap-0.5 font-semibold tabular-nums [&_svg]:size-3', none ? 'text-fg-subtle' : deltaGood ? 'text-success' : 'text-danger')}>
            {none ? null : down ? <ArrowDown strokeWidth={2.5} /> : <ArrowUp strokeWidth={2.5} />}{delta}
          </span>
          {compare != null && <span className="text-fg-subtle">{compare}</span>}
        </div>
      )}
    </div>
  );
}
