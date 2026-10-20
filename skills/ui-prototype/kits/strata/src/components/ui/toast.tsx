import * as React from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger' | 'loading';
export interface ToastData { id?: number; title: React.ReactNode; description?: React.ReactNode; tone?: ToastTone; action?: { label: string; onClick?: () => void }; duration?: number }

const icon: Record<ToastTone, React.ReactNode> = {
  info: <Info className="text-primary" />, loading: <LoaderCircle className="animate-spin text-primary" />,
  success: <CircleCheck className="text-success" />, warning: <TriangleAlert className="text-warning" />, danger: <CircleX className="text-danger" />,
};

let list: ToastData[] = [];
let seq = 0;
const subs = new Set<(l: ToastData[]) => void>();
const emit = () => subs.forEach((s) => s(list));

export function dismissToast(id: number) { list = list.filter((t) => t.id !== id); emit(); }

/** Show a toast. Success/info 4s, danger 6s, loading stays until dismissed. Max 4 on screen. */
export function toast(t: ToastData) {
  const id = ++seq;
  list = [...list.slice(-3), { ...t, id }];
  emit();
  const d = t.duration ?? (t.tone === 'loading' ? 0 : t.tone === 'danger' ? 6000 : 4000);
  if (d > 0) window.setTimeout(() => dismissToast(id), d);
  return id;
}

/** 64px two-line card: title + one line of detail (truncated). Title-only toasts keep the same height. */
export function ToastCard({ title, description, tone = 'info', action, onClose, className }: ToastData & { onClose?: () => void; className?: string }) {
  return (
    <div role="status" className={cn('flex min-h-16 items-center gap-2.5 rounded-md border border-border bg-surface-raised py-2.5 pr-2.5 pl-3.5 font-sans shadow-raised animate-toast-in', className)}>
      <span className="inline-flex shrink-0 [&_svg]:size-4">{icon[tone]}</span>
      <div className="min-w-0 flex-1">
        <div className="text-body-sm font-semibold text-fg">{title}</div>
        {description != null && <div className="mt-0.5 truncate text-caption leading-[18px] text-fg-muted">{description}</div>}
      </div>
      {action && <button type="button" onClick={action.onClick} className="h-6 shrink-0 cursor-pointer rounded-xs px-2 text-body-sm font-medium text-link hover:bg-primary-soft">{action.label}</button>}
      {onClose && <button type="button" aria-label="关闭" onClick={onClose} className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-subtle hover:bg-surface-hover hover:text-fg [&_svg]:size-3.5"><X /></button>}
    </div>
  );
}

/** Mount once near the root. Toasts appear bottom-right, newest last. */
export function Toaster() {
  const [items, setItems] = React.useState<ToastData[]>(list);
  React.useEffect(() => { subs.add(setItems); return () => { subs.delete(setItems); }; }, []);
  return createPortal(
    <div aria-live="polite" className="fixed right-4 bottom-4 z-[1100] flex w-90 max-w-[calc(100vw-32px)] flex-col gap-2">
      {items.map((t) => (
        <ToastCard key={t.id} {...t} onClose={() => dismissToast(t.id!)}
          action={t.action && { ...t.action, onClick: () => { t.action!.onClick?.(); dismissToast(t.id!); } }} />
      ))}
    </div>,
    document.body,
  );
}
