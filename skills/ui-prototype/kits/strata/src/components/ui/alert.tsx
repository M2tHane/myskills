import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toneIcon, type Tone } from './dialog';

const tones: Record<Tone, string> = {
  info: 'bg-info-soft border-info-line [&>.icon]:text-info',
  success: 'bg-success-soft border-success-line [&>.icon]:text-success',
  warning: 'bg-warning-soft border-warning-line [&>.icon]:text-warning',
  danger: 'bg-danger-soft border-danger-line [&>.icon]:text-danger',
};

export interface AlertProps {
  tone?: Tone;
  title: React.ReactNode;
  /** One line stating the problem; truncated if longer. Not an instruction. */
  children?: React.ReactNode;
  /** One small button: 查看 / 重试 / 升级套餐. */
  action?: React.ReactNode;
  /** Inline alerts are always dismissible. */
  onClose?: () => void;
  /** banner: full-width strip on top of a page or card, one line, 48px. */
  variant?: 'inline' | 'banner';
  className?: string;
}

/** A persistent state the user should notice. Inline: 64px two-line, same height as toasts. */
export function Alert({ tone = 'info', title, children, action, onClose, variant = 'inline', className }: AlertProps) {
  const Icon = toneIcon[tone];
  const banner = variant === 'banner';
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-center gap-2.5 border font-sans', tones[tone],
        banner ? 'min-h-12 rounded-none border-x-0 border-t-0 py-2 pr-3 pl-5' : 'min-h-16 rounded-md py-2.5 pr-2.5 pl-3.5', className)}>
      <Icon className="icon size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-body-sm font-semibold text-fg">{title}</div>
        {children != null && !banner && <div className="mt-px truncate text-body-sm text-fg-muted">{children}</div>}
      </div>
      {action != null && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
      {onClose && (
        <button type="button" aria-label="关闭" onClick={onClose}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-subtle hover:bg-(--hover-tint) hover:text-fg [&_svg]:size-3.5"><X /></button>
      )}
    </div>
  );
}
