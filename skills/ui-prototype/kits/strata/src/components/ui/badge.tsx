import * as React from 'react';
import { Check, CircleX, Clock, LoaderCircle, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken border-border text-fg-muted',
  primary: 'bg-primary-soft border-primary-line text-primary-hover',
  success: 'bg-success-soft border-success-line text-success',
  warning: 'bg-warning-soft border-warning-line text-warning',
  danger: 'bg-danger-soft border-danger-line text-danger',
};
const toneIcon: Record<BadgeTone, LucideIcon> = {
  neutral: Clock, primary: LoaderCircle, success: Check, warning: TriangleAlert, danger: CircleX,
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status: neutral 草稿/停用 · primary 运行中 · success 完成 · warning 待处理 · danger 失败. Also picks the icon. */
  tone?: BadgeTone;
  /** Override the tone's icon, or `false` for a plain label (version, environment). */
  icon?: React.ReactNode | false;
}

/** The only badge style: tinted ground, same-hue hairline, status-coloured text and a 12px icon. */
export function Badge({ tone = 'neutral', icon, className, children, ...props }: BadgeProps) {
  const Icon = toneIcon[tone];
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-xs border px-[7px] text-caption font-medium tabular-nums [&_svg]:size-3 [&_svg]:shrink-0',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {icon === false ? null : icon ?? <Icon strokeWidth={2.25} />}
      {children}
    </span>
  );
}

export interface CountBadgeProps { count: number; max?: number; tone?: 'neutral' | 'primary' | 'danger'; className?: string }

/** Counts on navigation items and icons. Current item `primary`, alerts `danger`, else `neutral`. */
export function CountBadge({ count, max = 99, tone = 'neutral', className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-[5px] text-micro font-semibold tabular-nums',
        tone === 'neutral' && 'bg-surface-active text-fg-muted',
        tone === 'primary' && 'bg-primary text-primary-fg',
        tone === 'danger' && 'bg-danger text-primary-fg shadow-[0_0_0_2px_var(--surface)]',
        className,
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
