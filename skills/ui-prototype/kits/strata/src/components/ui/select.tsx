import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, CircleX, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

export interface SelectOption { value: string; label: string; group?: string; disabled?: boolean; icon?: React.ReactNode; meta?: React.ReactNode }

interface BaseProps {
  options: SelectOption[];
  placeholder?: string;
  /** Search bar in the list. Defaults to on when there are more than `searchThreshold` (8) options. */
  searchable?: boolean;
  searchThreshold?: number;
  searchPlaceholder?: string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  /** Open the list above the trigger. Radix flips automatically near the viewport edge. */
  placement?: 'bottom' | 'top';
  defaultOpen?: boolean;
  className?: string;
  'aria-label'?: string;
}

const triggerBase = [
  'group/trigger flex w-full min-w-0 items-center gap-1.5 rounded-sm border border-border-strong bg-surface pl-2.5 pr-2 text-left font-sans text-fg shadow-control',
  'cursor-pointer outline-none transition-[border-color,box-shadow] duration-100',
  'hover:border-(--gray-400) focus-visible:border-ring focus-visible:shadow-focus-input data-[state=open]:border-ring data-[state=open]:shadow-focus-input',
  'data-[invalid]:border-danger data-[invalid]:data-[state=open]:shadow-focus-input-danger',
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:text-fg-disabled disabled:shadow-none',
];
const sizeClass = { sm: 'h-(--control-sm) text-caption', md: 'h-(--control-md) text-body-sm', lg: 'h-(--control-lg) text-body' };
/** 触发器样式：日期选择等「看起来像下拉框」的控件复用。 */
export const fieldTriggerClass = triggerBase;
export const fieldTriggerSize = sizeClass;
export { Highlight };
const contentClass = 'z-[950] w-(--radix-popover-trigger-width) min-w-40 max-w-[360px] overflow-hidden rounded-md border border-border bg-surface-raised font-sans text-body-sm shadow-raised animate-pop-in';

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="bg-transparent font-semibold text-primary-hover">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

function filter(options: SelectOption[], q: string) {
  if (!q) return options;
  const s = q.toLowerCase();
  return options.filter((o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s));
}

function SearchBox({ q, setQ, onKeyDown, placeholder }: { q: string; setQ: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void; placeholder: string }) {
  return (
    <div className="flex h-9 items-center gap-1.5 border-b border-border-subtle bg-surface px-2.5 text-fg-subtle [&_svg]:size-[15px] [&_svg]:shrink-0">
      <Search />
      <input autoFocus value={q} placeholder={placeholder} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-body-sm text-fg outline-none placeholder:text-fg-subtle" />
      {q && <button type="button" aria-label="清除" onClick={() => setQ('')} className="inline-flex size-5 cursor-pointer items-center justify-center rounded-xs text-fg-disabled hover:text-fg-muted"><CircleX /></button>}
    </div>
  );
}

function OptionList({ options, q, isOn, multi, active, setActive, pick }: {
  options: SelectOption[]; q: string; isOn: (v: string) => boolean; multi?: boolean;
  active: number; setActive: (i: number) => void; pick: (o: SelectOption) => void;
}) {
  if (!options.length) return <div className="px-3 py-5 text-center text-body-sm text-fg-subtle">无匹配结果</div>;
  let last: string | undefined;
  return (
    <div role="listbox" aria-multiselectable={multi || undefined} className="max-h-62 overflow-y-auto p-1">
      {options.map((o, i) => {
        const head = o.group && o.group !== last ? <div key={'g' + o.group} className="px-2 pt-2 pb-1 text-micro font-medium tracking-[.02em] text-fg-subtle first:pt-1">{o.group}</div> : null;
        last = o.group;
        const on = isOn(o.value);
        return (
          <React.Fragment key={o.value}>
            {head}
            <div
              role="option"
              aria-selected={on}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => !o.disabled && pick(o)}
              className={cn(
                'flex h-8 cursor-pointer items-center gap-2 whitespace-nowrap rounded-sm px-2 text-fg data-[active]:bg-surface-hover',
                on && 'font-medium',
                o.disabled && 'cursor-not-allowed text-fg-disabled',
              )}
            >
              {multi && (
                <span className={cn('inline-flex size-4 shrink-0 items-center justify-center rounded-xs border', on ? 'border-primary-hover bg-primary text-primary-fg shadow-primary' : 'border-border-strong bg-surface shadow-xs')}>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
              )}
              {o.icon && <span className="inline-flex shrink-0 text-fg-subtle [&_svg]:size-[15px]">{o.icon}</span>}
              <span className="min-w-0 flex-1 truncate"><Highlight text={o.label} q={q} /></span>
              {o.meta != null && <span className="text-caption font-normal text-fg-subtle tabular-nums">{o.meta}</span>}
              {!multi && on && <Check className="size-[15px] shrink-0 text-primary" />}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function useListKeys(n: number, onEnter: (i: number) => void, close: () => void) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => { setActive(0); }, [n]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(n - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); onEnter(active); }
    else if (e.key === 'Escape') { close(); }
  };
  return { active, setActive, onKeyDown };
}

/* ------------------------------------------------------------------ Select */
export interface SelectProps extends BaseProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  leftIcon?: React.ReactNode;
}

/** Single-select dropdown. More than 8 options → a search bar appears automatically. */
export function Select({
  options, value, defaultValue, onValueChange, placeholder = '请选择', searchable, searchThreshold = 8, searchPlaceholder = '搜索',
  size = 'md', invalid, disabled, leftIcon, placement = 'bottom', defaultOpen, className, ...aria
}: SelectProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(!!defaultOpen);
  const [q, setQ] = React.useState('');
  const cur = value ?? inner;
  const withSearch = searchable ?? options.length > searchThreshold;
  const shown = filter(options, withSearch ? q : '');
  const change = (o: boolean) => { setOpen(o); if (!o) setQ(''); };
  const pick = (o: SelectOption) => { setInner(o.value); onValueChange?.(o.value); change(false); };
  const keys = useListKeys(shown.length, (i) => shown[i] && !shown[i].disabled && pick(shown[i]), () => change(false));
  const sel = options.find((o) => o.value === cur);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={change}>
      <PopoverPrimitive.Trigger asChild>
        <button type="button" disabled={disabled} aria-haspopup="listbox" data-invalid={invalid || undefined} onKeyDown={!withSearch && open ? keys.onKeyDown : undefined}
          className={cn(triggerBase, sizeClass[size], className)} {...aria}>
          {leftIcon && <span className="inline-flex shrink-0 text-fg-subtle [&_svg]:size-[15px]">{leftIcon}</span>}
          {sel?.icon && !leftIcon && <span className="inline-flex shrink-0 text-fg-subtle [&_svg]:size-[15px]">{sel.icon}</span>}
          <span className={cn('min-w-0 flex-1 truncate', !sel && 'text-fg-subtle')}>{sel ? sel.label : placeholder}</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-fg-subtle transition-transform duration-150 group-data-[state=open]/trigger:rotate-180" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side={placement} align="start" sideOffset={4} collisionPadding={8} className={contentClass}
          onOpenAutoFocus={(e) => { if (!withSearch) e.preventDefault(); }}>
          {withSearch && <SearchBox q={q} setQ={setQ} onKeyDown={keys.onKeyDown} placeholder={searchPlaceholder} />}
          <OptionList options={shown} q={withSearch ? q : ''} isOn={(v) => v === cur} active={keys.active} setActive={keys.setActive} pick={pick} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ------------------------------------------------------------- MultiSelect */
export interface MultiSelectProps extends BaseProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Tags shown in the trigger before collapsing into “+N” (hover +N to list the rest). */
  maxTags?: number;
}

/** Multi-select dropdown: removable tags, checkbox list, “已选 N / 总数 · 全选 · 清空” footer. */
export function MultiSelect({
  options, value, defaultValue = [], onValueChange, placeholder = '请选择', searchable, searchThreshold = 8, searchPlaceholder = '搜索',
  size = 'md', invalid, disabled, placement = 'bottom', defaultOpen, maxTags = 2, className, ...aria
}: MultiSelectProps) {
  const [inner, setInner] = React.useState<string[]>(defaultValue);
  const [open, setOpen] = React.useState(!!defaultOpen);
  const [q, setQ] = React.useState('');
  const cur = value ?? inner;
  const set = (v: string[]) => { setInner(v); onValueChange?.(v); };
  const withSearch = searchable ?? options.length > searchThreshold;
  const shown = filter(options, withSearch ? q : '');
  const change = (o: boolean) => { setOpen(o); if (!o) setQ(''); };
  const toggle = (o: SelectOption) => set(cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value]);
  const keys = useListKeys(shown.length, (i) => shown[i] && !shown[i].disabled && toggle(shown[i]), () => change(false));
  const picked = cur.map((v) => options.find((o) => o.value === v)).filter(Boolean) as SelectOption[];
  const rest = picked.slice(maxTags);
  const tag = 'inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded-xs border border-border bg-surface-active pl-[7px] pr-[3px] text-caption font-medium text-fg';
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={change}>
      <PopoverPrimitive.Trigger asChild>
        <div role="button" tabIndex={disabled ? -1 : 0} aria-haspopup="listbox" aria-disabled={disabled || undefined} data-invalid={invalid || undefined}
          onKeyDown={!withSearch && open ? keys.onKeyDown : undefined}
          className={cn(triggerBase, 'h-auto min-h-(--control-md) py-1 pl-1', sizeClass[size].split(' ')[1], disabled && 'pointer-events-none border-border bg-surface-sunken text-fg-disabled shadow-none', className)} {...aria}>
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {!picked.length && <span className="truncate pl-1.5 text-fg-subtle">{placeholder}</span>}
            {picked.slice(0, maxTags).map((o) => (
              <span key={o.value} className={tag}>
                {o.label}
                <button type="button" aria-label={`移除 ${o.label}`} onClick={(e) => { e.stopPropagation(); set(cur.filter((x) => x !== o.value)); }}
                  className="inline-flex size-4 cursor-pointer items-center justify-center rounded-[3px] text-fg-subtle hover:bg-(--gray-200) hover:text-fg"><X className="size-3" /></button>
              </span>
            ))}
            {rest.length > 0 && (
              <Tooltip side="bottom" delay={150} appearance="light" content={
                <span className="flex min-w-24 max-w-60 flex-col">
                  {rest.map((o) => <span key={o.value} className="flex h-7 items-center truncate px-2 text-body-sm text-fg [&+&]:border-t [&+&]:border-border-subtle">{o.label}</span>)}
                </span>
              }>
                <span tabIndex={0} className={cn(tag, 'bg-surface px-[7px] text-fg-muted')} aria-label={`另有 ${rest.length} 项：${rest.map((o) => o.label).join('、')}`}>+{rest.length}</span>
              </Tooltip>
            )}
          </span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-fg-subtle transition-transform duration-150 group-data-[state=open]/trigger:rotate-180" />
        </div>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side={placement} align="start" sideOffset={4} collisionPadding={8} className={contentClass}
          onOpenAutoFocus={(e) => { if (!withSearch) e.preventDefault(); }}>
          {withSearch && <SearchBox q={q} setQ={setQ} onKeyDown={keys.onKeyDown} placeholder={searchPlaceholder} />}
          <OptionList options={shown} q={withSearch ? q : ''} multi isOn={(v) => cur.includes(v)} active={keys.active} setActive={keys.setActive} pick={toggle} />
          <div className="flex h-9 items-center justify-between border-t border-border-subtle bg-surface-sunken pr-1.5 pl-3 text-caption text-fg-muted">
            <span>已选 <b className="font-semibold text-fg tabular-nums">{cur.length}</b> / {options.length}</span>
            <span className="inline-flex gap-0.5">
              <button type="button" className="h-6 cursor-pointer rounded-xs px-2 font-medium text-link hover:bg-primary-soft"
                onClick={() => set(Array.from(new Set([...cur, ...shown.filter((o) => !o.disabled).map((o) => o.value)])))}>全选</button>
              <button type="button" disabled={!cur.length} className="h-6 cursor-pointer rounded-xs px-2 font-medium text-link hover:bg-primary-soft disabled:cursor-default disabled:bg-transparent disabled:text-fg-disabled"
                onClick={() => set([])}>清空</button>
            </span>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
