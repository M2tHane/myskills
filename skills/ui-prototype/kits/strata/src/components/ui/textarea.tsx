import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Character count in the bottom-right corner, above the resize grip. */
  showCount?: boolean;
  /** SQL, JSON, scripts. */
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, showCount, mono, rows = 3, maxLength, value, defaultValue, onChange, disabled, className, ...props },
  ref,
) {
  const local = React.useRef<HTMLTextAreaElement | null>(null);
  const setRefs = React.useCallback((el: HTMLTextAreaElement | null) => {
    local.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  const [inner, setInner] = React.useState(defaultValue != null ? String(defaultValue) : '');
  const controlled = value !== undefined;
  const cur = controlled ? String(value ?? '') : inner;
  React.useLayoutEffect(() => { if (!controlled && local.current) setInner(local.current.value); }, [controlled]);
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        // the wrapper resizes, so the grip sits below the count
        'relative flex w-full min-h-16 resize-y flex-col overflow-hidden rounded-sm border border-border-strong bg-surface shadow-inset font-sans',
        'transition-[border-color,box-shadow] duration-100 hover:border-(--gray-400) focus-within:border-ring focus-within:shadow-focus-input',
        invalid && 'border-danger hover:border-danger focus-within:border-danger focus-within:shadow-focus-input-danger',
        disabled && 'border-border bg-surface-sunken shadow-none hover:border-border',
      )}
    >
      <textarea
        ref={setRefs}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...(controlled ? { value: cur } : { defaultValue })}
        onChange={(e) => { if (!controlled) setInner(e.target.value); onChange?.(e); }}
        className={cn(
          'block min-h-0 w-full flex-auto resize-none border-0 bg-transparent px-2.5 py-[7px] text-body-sm text-fg outline-none placeholder:text-fg-subtle',
          'disabled:cursor-not-allowed disabled:text-fg-disabled',
          mono && 'bg-surface-sunken font-mono text-code [font-variant-ligatures:none]',
          className,
        )}
        {...props}
      />
      {showCount && (
        <span className="pointer-events-none flex-none self-end pr-[18px] pb-[5px] pl-2 text-micro text-fg-subtle tabular-nums">
          {cur.length}{maxLength ? ` / ${maxLength}` : ''}
        </span>
      )}
    </div>
  );
});
