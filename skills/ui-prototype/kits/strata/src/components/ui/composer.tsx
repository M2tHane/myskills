import * as React from 'react';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';

export interface ComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  /** 回车或点发送。文字已去掉首尾空白；有附件时文字可以为空。发送后组件自己清空（非受控时）。 */
  onSubmit?: (text: string) => void;
  /** 生成中：发送按钮变成「停止」，回车不发送。 */
  busy?: boolean;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** 待发送的附件（FileChip），显示在文字上方。 */
  attachments?: React.ReactNode;
  /** 传了就有回形针按钮，并且支持拖入、粘贴文件。 */
  onAttach?: (files: File[]) => void;
  accept?: string;
  /** 左下角的其他工具：模型选择（Select size="sm"）、知识库开关等。 */
  tools?: React.ReactNode;
  /** 最多自动长高到几行，超过后内部滚动。 */
  maxRows?: number;
  autoFocus?: boolean;
  className?: string;
}

const LINE = 22; // text-body 行高

/**
 * 对话输入框：白底、细边框、控件阴影，聚焦时边框变蓝。文字区随内容自动长高（1 行起，最多 maxRows 行）。
 * Enter 发送，Shift + Enter 换行；输入法组字时的回车不会发送。
 * 底部一行：左侧回形针和 tools，右侧发送（实心蓝，没有内容时变浅不可点）/ 停止。
 */
export const Composer = React.forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer({
  value, defaultValue = '', onValueChange, onSubmit, busy, onStop, disabled, placeholder = '输入消息', attachments, onAttach, accept,
  tools, maxRows = 8, autoFocus, className,
}, ref) {
  const [inner, setInner] = React.useState(defaultValue);
  const text = value ?? inner;
  const set = (v: string) => { if (value === undefined) setInner(v); onValueChange?.(v); };
  const area = React.useRef<HTMLTextAreaElement | null>(null);
  const file = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState(false);
  const hasFiles = React.Children.count(attachments) > 0;
  const canSend = !disabled && !busy && (text.trim().length > 0 || hasFiles);

  React.useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, LINE * maxRows + 16)}px`;
  }, [text, maxRows]);

  const send = () => {
    if (!canSend) return;
    onSubmit?.(text.trim());
    if (value === undefined) setInner('');
  };
  const files = (list: FileList | null | undefined) => { const fs = Array.from(list ?? []); if (fs.length && onAttach) onAttach(fs); };

  return (
    <div
      onDragOver={onAttach ? (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDrag(true); } } : undefined}
      onDragLeave={onAttach ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false); } : undefined}
      onDrop={onAttach ? (e) => { e.preventDefault(); setDrag(false); files(e.dataTransfer.files); } : undefined}
      onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); area.current?.focus(); } }}
      className={cn(
        'flex flex-col rounded-md border border-border-strong bg-surface font-sans shadow-control transition-[border-color,box-shadow] duration-100',
        'focus-within:border-ring focus-within:shadow-focus-input',
        drag && 'border-primary bg-primary-soft',
        disabled && 'border-border bg-surface-sunken shadow-none',
        className,
      )}>
      {hasFiles && <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">{attachments}</div>}
      <textarea
        ref={(el) => { area.current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el; }}
        rows={1}
        value={text}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); }
        }}
        onPaste={onAttach ? (e) => { if (e.clipboardData.files.length) { e.preventDefault(); files(e.clipboardData.files); } } : undefined}
        className="block max-h-none w-full resize-none border-0 bg-transparent px-3 pt-2.5 pb-1 text-body text-fg outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed"
      />
      <div className="flex h-11 items-center gap-1 px-2">
        {onAttach && (
          <>
            <IconButton size="sm" icon={<Paperclip />} label="添加文件" disabled={disabled} onClick={() => file.current?.click()} />
            <input ref={file} type="file" multiple accept={accept} hidden onChange={(e) => { files(e.target.files); e.target.value = ''; }} />
          </>
        )}
        {tools}
        <span className="flex-1" />
        {busy ? (
          <Tooltip content="停止生成">
            <Button size="icon-sm" aria-label="停止生成" onClick={onStop} className="rounded-full"><Square className="fill-current" /></Button>
          </Tooltip>
        ) : (
          <Tooltip content="发送" shortcut={['Enter']}>
            <Button size="icon-sm" variant="default" aria-label="发送" disabled={!canSend} onClick={send} className="rounded-full"><ArrowUp strokeWidth={2.5} /></Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
