import * as React from 'react';
import { CircleX, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  /** Short text inside the field after the value (unit). */
  suffix?: React.ReactNode;
  /** Attached gray segment outside the field (protocol, domain, unit). */
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  invalid?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  wrapperClassName?: string;
}

const box = [
  'relative flex min-w-0 flex-1 items-center gap-1.5 px-2.5 rounded-sm border border-border-strong bg-surface shadow-inset',
  'transition-[border-color,box-shadow] duration-100',
  'group-hover/input:border-(--gray-400) group-focus-within/input:border-ring group-focus-within/input:shadow-focus-input',
  'group-data-[invalid]/input:border-danger group-data-[invalid]/input:group-focus-within/input:shadow-focus-input-danger',
  'group-data-[readonly]/input:bg-surface-sunken group-data-[readonly]/input:border-border group-data-[readonly]/input:shadow-none',
  'group-data-[disabled]/input:bg-surface-sunken group-data-[disabled]/input:border-border group-data-[disabled]/input:shadow-none',
];

/** Single-line text field. Placeholder is an example or the field name — never an explanatory sentence. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', leftIcon, suffix, addonBefore, addonAfter, invalid, clearable, onClear, className, wrapperClassName, type = 'text', disabled, readOnly, value, defaultValue, onChange, ...props },
  ref,
) {
  // 受控（value）与非受控（defaultValue / react-hook-form 的 register）都支持；非受控时只跟踪内容用于显示清除按钮。
  const local = React.useRef<HTMLInputElement | null>(null);
  const setRefs = React.useCallback((el: HTMLInputElement | null) => {
    local.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  const [inner, setInner] = React.useState(defaultValue != null ? String(defaultValue) : '');
  const [reveal, setReveal] = React.useState(false);
  const controlled = value !== undefined;
  const cur = controlled ? String(value ?? '') : inner;
  React.useLayoutEffect(() => { if (!controlled && local.current) setInner(local.current.value); }, [controlled]);
  const clear = () => {
    if (!controlled && local.current) {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      set.call(local.current, '');
      local.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    onClear?.();
  };
  const pwd = type === 'password';
  const iconBtn = 'inline-flex size-5 -mr-1 shrink-0 cursor-pointer items-center justify-center rounded-xs text-fg-disabled hover:bg-surface-hover hover:text-fg-muted [&_svg]:size-[15px]';
  return (
    <div
      className={cn(
        'group/input flex w-full min-w-0 items-stretch font-sans',
        size === 'sm' ? 'h-(--control-sm) text-caption' : size === 'lg' ? 'h-(--control-lg) text-body' : 'h-(--control-md) text-body-sm',
        wrapperClassName,
      )}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      {addonBefore != null && (
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-l-sm border border-r-0 border-border-strong bg-surface-sunken px-2.5 text-fg-muted group-data-[disabled]/input:text-fg-disabled">
          {addonBefore}
        </span>
      )}
      <span className={cn(box, size === 'sm' && 'px-2', addonBefore != null && 'rounded-l-none', addonAfter != null && 'rounded-r-none')}>
        {leftIcon && <span className="inline-flex shrink-0 text-fg-subtle [&_svg]:size-[15px]">{leftIcon}</span>}
        <input
          ref={setRefs}
          type={pwd && reveal ? 'text' : type}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          {...(controlled ? { value: cur } : { defaultValue })}
          onChange={(e) => { if (!controlled) setInner(e.target.value); onChange?.(e); }}
          className={cn(
            'h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-fg tabular-nums outline-none placeholder:text-fg-subtle',
            'disabled:cursor-not-allowed disabled:text-fg-disabled',
            className,
          )}
          {...props}
        />
        {clearable && cur && !disabled && !readOnly && (
          <button type="button" aria-label="清除" className={iconBtn} onClick={clear}><CircleX /></button>
        )}
        {pwd && (
          <button type="button" aria-label={reveal ? '隐藏密码' : '显示密码'} className={iconBtn} onClick={() => setReveal((r) => !r)}>{reveal ? <EyeOff /> : <Eye />}</button>
        )}
        {suffix != null && <span className="shrink-0 text-caption text-fg-subtle">{suffix}</span>}
      </span>
      {addonAfter != null && (
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-r-sm border border-l-0 border-border-strong bg-surface-sunken px-2.5 text-fg-muted group-data-[disabled]/input:text-fg-disabled">
          {addonAfter}
        </span>
      )}
    </div>
  );
});
