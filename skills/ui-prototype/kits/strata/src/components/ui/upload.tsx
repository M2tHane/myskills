import * as React from 'react';
import { CircleAlert, File, FileSpreadsheet, FileText, Image as ImageIcon, RotateCw, Upload as UploadIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './progress';

/* -------------------------------------------------------------- helpers */

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
function fileIcon(name: string) {
  const e = ext(name);
  if (['csv', 'xlsx', 'xls'].includes(e)) return <FileSpreadsheet />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return <ImageIcon />;
  if (['txt', 'md', 'json', 'sql', 'pdf', 'doc', 'docx'].includes(e)) return <FileText />;
  return <File />;
}

function matches(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(',').map((a) => a.trim().toLowerCase()).some((a) =>
    a.startsWith('.') ? file.name.toLowerCase().endsWith(a) : a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a);
}

/* ------------------------------------------------------------- Dropzone */

export interface RejectedFile { file: File; reason: string }

export interface DropzoneProps {
  /** 同 <input accept>，如 ".csv,.xlsx"。 */
  accept?: string;
  multiple?: boolean;
  /** 单个文件上限（字节）。 */
  maxSize?: number;
  disabled?: boolean;
  /** 主文案，默认「拖拽文件到这里，或」+「选择文件」链接。写清楚接受的格式，例如「拖拽 CSV、XLSX 文件到这里，或」。 */
  title?: React.ReactNode;
  onFiles: (accepted: File[], rejected: RejectedFile[]) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * 拖拽上传区：下沉底 + 虚线框；拖入时变成浅蓝底蓝框。点击整块或「选择文件」都能打开文件选择。
 * 格式和大小在 onFiles 里分成 accepted / rejected，被拒文件放进 UploadList 显示错误，不另写说明文字。
 */
export function Dropzone({ accept, multiple = true, maxSize, disabled, title, onFiles, size = 'md', className }: DropzoneProps) {
  const input = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const ok: File[] = [], bad: RejectedFile[] = [];
    for (const f of files) {
      if (!matches(f, accept)) bad.push({ file: f, reason: '格式不支持' });
      else if (maxSize && f.size > maxSize) bad.push({ file: f, reason: `超过 ${formatBytes(maxSize)}` });
      else ok.push(f);
    }
    onFiles(ok, bad);
  };
  return (
    <div
      role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); input.current?.click(); } }}
      onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      data-over={over || undefined}
      className={cn(
        'group/drop flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border-strong bg-surface-sunken font-sans text-center outline-none',
        'transition-[background-color,border-color,box-shadow] duration-100 hover:border-(--gray-400) hover:bg-surface-hover focus-visible:shadow-focus-ring',
        'data-[over]:border-primary data-[over]:bg-primary-soft',
        size === 'sm' ? 'h-24 flex-row gap-3' : 'h-36',
        disabled && 'cursor-not-allowed border-border bg-surface-sunken text-fg-disabled hover:border-border hover:bg-surface-sunken',
        className,
      )}>
      <span className={cn('inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-fg-muted shadow-xs [&_svg]:size-[18px]',
        'group-data-[over]/drop:border-primary-line group-data-[over]/drop:text-primary', disabled && 'text-fg-disabled')}>
        <UploadIcon />
      </span>
      <span className="text-body-sm text-fg">
        {title ?? '拖拽文件到这里，或'}<span className={cn('ml-1 font-medium text-link', disabled && 'text-fg-disabled')}>选择文件</span>
      </span>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} disabled={disabled}
        onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

/* ----------------------------------------------------------- UploadList */

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: 'waiting' | 'uploading' | 'done' | 'error';
  /** 0–100，uploading 时显示。 */
  progress?: number;
  /** 出错原因：「格式不支持」「超过 50 MB」「网络中断」。 */
  error?: string;
  /** 出错后能否重试。格式、大小不符的文件设为 false。默认 true。 */
  retryable?: boolean;
}

export interface UploadListProps {
  items: UploadItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

/** 文件列表：图标块 · 文件名 · 状态（百分比 / 大小 / 错误）· 细进度条 · 重试 / 移除。 */
export function UploadList({ items, onRemove, onRetry, className }: UploadListProps) {
  if (!items.length) return null;
  return (
    <div role="list" className={cn('flex flex-col overflow-hidden rounded-md border border-border bg-surface font-sans shadow-card', className)}>
      {items.map((it) => {
        const err = it.status === 'error';
        const status = err ? it.error ?? '上传失败'
          : it.status === 'done' ? formatBytes(it.size)
          : it.status === 'waiting' ? '等待中'
          : `${Math.round(it.progress ?? 0)}% · ${formatBytes(it.size)}`;
        return (
          <div key={it.id} role="listitem" className="flex items-center gap-3 py-2.5 pr-2 pl-3 [&+&]:border-t [&+&]:border-border-subtle">
            <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface-sunken text-fg-muted [&_svg]:size-4',
              err && 'border-danger-line bg-danger-soft text-danger')}>
              {err ? <CircleAlert /> : fileIcon(it.name)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="truncate font-medium text-fg">{it.name}</span>
                <span className={cn('shrink-0 text-caption tabular-nums', err ? 'text-danger' : 'text-fg-subtle')}>{status}</span>
              </div>
              {(it.status === 'uploading' || it.status === 'waiting') && <Progress size="sm" showValue={false} value={it.progress ?? 0} />}
            </div>
            <span className="flex shrink-0 items-center">
              {err && onRetry && it.retryable !== false && (
                <button type="button" aria-label="重试" onClick={() => onRetry(it.id)}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-fg-muted outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-3.5"><RotateCw /></button>
              )}
              {onRemove && (
                <button type="button" aria-label={it.status === 'uploading' ? '取消上传' : '移除'} onClick={() => onRemove(it.id)}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-fg-subtle outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-3.5"><X /></button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
