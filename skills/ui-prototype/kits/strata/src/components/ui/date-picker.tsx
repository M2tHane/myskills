import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  addDays, addMonths, endOfMonth, format, isAfter, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek, subDays, subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldTriggerClass, fieldTriggerSize } from './select';

export interface DateRange { from: Date; to: Date }

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
const today = () => startOfDay(new Date());

/* ------------------------------------------------------------------ Month */

interface MonthProps {
  month: Date;
  selected?: Date;
  range?: { from?: Date; to?: Date };
  hover?: Date;
  min?: Date;
  max?: Date;
  focusDate: Date;
  onPick: (d: Date) => void;
  onHover?: (d?: Date) => void;
  onFocusDate: (d: Date) => void;
}

/** 一个月的日历网格：周一开头，固定 6 行，高度不随月份跳动。 */
function Month({ month, selected, range, hover, min, max, focusDate, onPick, onHover, onFocusDate }: MonthProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const now = today();
  let from = range?.from, to = range?.to ?? (range?.from && hover ? hover : undefined);
  if (from && to && isBefore(to, from)) [from, to] = [to, from];
  const out = (d: Date) => (min && isBefore(d, startOfDay(min))) || (max && isAfter(d, startOfDay(max)));

  const key = (e: React.KeyboardEvent, d: Date) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (step[e.key] != null) { e.preventDefault(); onFocusDate(addDays(d, step[e.key])); }
    else if (e.key === 'PageUp') { e.preventDefault(); onFocusDate(subMonths(d, 1)); }
    else if (e.key === 'PageDown') { e.preventDefault(); onFocusDate(addMonths(d, 1)); }
  };

  return (
    <div role="grid" aria-label={format(month, 'yyyy 年 M 月')} className="w-[232px]" onMouseLeave={() => onHover?.(undefined)}>
      <div role="row" className="grid grid-cols-7">
        {WEEK.map((w) => <span key={w} role="columnheader" className="flex h-7 items-center justify-center text-caption text-fg-subtle">{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const isSel = (selected && isSameDay(d, selected)) || (from && isSameDay(d, from)) || (to && isSameDay(d, to));
          const inRange = from && to && isAfter(d, from) && isBefore(d, to);
          const isFrom = from && to && isSameDay(d, from) && !isSameDay(from, to);
          const isTo = from && to && isSameDay(d, to) && !isSameDay(from, to);
          const disabled = !!out(d);
          const isToday = isSameDay(d, now);
          const focused = isSameDay(d, focusDate);
          return (
            <div key={d.toISOString()} role="gridcell" aria-selected={!!isSel || undefined}
              className={cn('flex h-8 items-center justify-center',
                inRange && inMonth && 'bg-primary-soft',
                isFrom && inMonth && 'bg-linear-to-r from-transparent from-50% to-primary-soft to-50%',
                isTo && inMonth && 'bg-linear-to-l from-transparent from-50% to-primary-soft to-50%')}>
              <button type="button" tabIndex={focused ? 0 : -1} disabled={disabled} data-date={fmt(d)}
                onClick={() => onPick(d)} onMouseEnter={() => onHover?.(d)} onKeyDown={(e) => key(e, d)} onFocus={() => !focused && onFocusDate(d)}
                className={cn(
                  'relative inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-body-sm tabular-nums outline-none transition-colors duration-100',
                  'focus-visible:shadow-focus-ring',
                  inMonth ? 'text-fg' : 'text-fg-disabled',
                  !isSel && !inRange && 'hover:bg-surface-hover',
                  inRange && inMonth && 'text-primary-hover hover:bg-primary-soft-hover',
                  isSel && inMonth && 'bg-primary font-medium text-primary-fg shadow-primary hover:bg-primary-hover',
                  isToday && !isSel && 'font-semibold text-primary',
                  disabled && 'cursor-not-allowed text-fg-disabled hover:bg-transparent',
                )}>
                {d.getDate()}
                {isToday && !isSel && <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-fg-muted outline-none hover:bg-surface-hover hover:text-fg focus-visible:shadow-focus-ring disabled:pointer-events-none disabled:text-fg-disabled [&_svg]:size-4">
      {children}
    </button>
  );
}

/** 月份标题与翻页。`canGo(n)` 返回 false 的方向置灰（范围选择里左右两个月不能重叠）。 */
function MonthHeader({ month, onGo, canGo = () => true }: { month: Date; onGo: (n: number) => void; canGo?: (n: number) => boolean }) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="flex"><NavButton label="上一年" disabled={!canGo(-12)} onClick={() => onGo(-12)}><ChevronsLeft /></NavButton><NavButton label="上个月" disabled={!canGo(-1)} onClick={() => onGo(-1)}><ChevronLeft /></NavButton></span>
      <span className="text-body-sm font-semibold tabular-nums text-fg">{format(month, 'yyyy 年 M 月')}</span>
      <span className="flex"><NavButton label="下个月" disabled={!canGo(1)} onClick={() => onGo(1)}><ChevronRight /></NavButton><NavButton label="下一年" disabled={!canGo(12)} onClick={() => onGo(12)}><ChevronsRight /></NavButton></span>
    </div>
  );
}

/* --------------------------------------------------------------- Calendar */

export interface CalendarProps { value?: Date; onValueChange?: (d: Date) => void; min?: Date; max?: Date; className?: string }

/** 单月日历，可直接嵌在页面或浮层里。 */
export function Calendar({ value, onValueChange, min, max, className }: CalendarProps) {
  const [month, setMonth] = React.useState(startOfMonth(value ?? today()));
  const [focus, setFocus] = React.useState(value ?? today());
  const ref = React.useRef<HTMLDivElement>(null);
  const moveFocus = (d: Date) => {
    setFocus(d);
    if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>(`[data-date="${fmt(d)}"]`)?.focus());
  };
  return (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
      <MonthHeader month={month} onGo={(n) => setMonth(addMonths(month, n))} />
      <Month month={month} selected={value} min={min} max={max} focusDate={focus} onFocusDate={moveFocus} onPick={(d) => onValueChange?.(d)} />
    </div>
  );
}

/* ------------------------------------------------------------- shared bits */

interface TriggerProps {
  open: boolean;
  text?: string;
  placeholder: string;
  size: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  clearable: boolean;
  onClear: () => void;
  className?: string;
  'aria-label'?: string;
}

const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(function Trigger(
  { open, text, placeholder, size, invalid, disabled, clearable, onClear, className, ...rest }, ref,
) {
  return (
    <button ref={ref} type="button" disabled={disabled} data-invalid={invalid || undefined} data-state={open ? 'open' : 'closed'}
      className={cn(fieldTriggerClass, fieldTriggerSize[size], 'group/date', className)} {...rest}>
      <CalendarDays className="size-4 shrink-0 text-fg-subtle" />
      <span className={cn('min-w-0 flex-1 truncate tabular-nums', !text && 'text-fg-subtle')}>{text ?? placeholder}</span>
      {clearable && text && !disabled && (
        <span role="button" tabIndex={-1} aria-label="清除" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
          className="hidden size-4 shrink-0 cursor-pointer items-center justify-center text-fg-disabled group-hover/date:inline-flex hover:text-fg-muted [&_svg]:size-3.5">
          <CircleX />
        </span>
      )}
    </button>
  );
});

const panelClass = 'z-[950] rounded-md border border-border bg-surface-raised font-sans shadow-raised outline-none data-[state=open]:animate-pop-in';

/* ------------------------------------------------------------- DatePicker */

export interface DatePickerProps {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  min?: Date;
  max?: Date;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  defaultOpen?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** 单个日期。触发器与 Select 同款；浮层是一个月的日历，底部可一键选今天。 */
export function DatePicker({ value, defaultValue, onValueChange, placeholder = '选择日期', min, max, size = 'md', invalid, disabled, clearable = true, defaultOpen = false, className, ...aria }: DatePickerProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(defaultOpen);
  const cur = value !== undefined ? value : inner;
  const set = (d?: Date) => { setInner(d); onValueChange?.(d); };
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Trigger open={open} text={cur ? fmt(cur) : undefined} placeholder={placeholder} size={size} invalid={invalid} disabled={disabled}
          clearable={clearable} onClear={() => set(undefined)} className={className} aria-label={aria['aria-label']} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={4} collisionPadding={8} className={cn(panelClass, 'p-3')}
          onOpenAutoFocus={(e) => { e.preventDefault(); requestAnimationFrame(() => (e.target as HTMLElement | null)?.querySelector?.<HTMLButtonElement>('[tabindex="0"][data-date]')?.focus()); }}>
          <Calendar value={cur} min={min} max={max} onValueChange={(d) => { set(d); setOpen(false); }} />
          <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
            <button type="button" onClick={() => { set(today()); setOpen(false); }} className="h-7 cursor-pointer rounded-sm px-2 text-body-sm font-medium text-link hover:bg-primary-soft">今天</button>
            {cur && clearable && <button type="button" onClick={() => { set(undefined); setOpen(false); }} className="h-7 cursor-pointer rounded-sm px-2 text-body-sm text-fg-muted hover:bg-surface-hover hover:text-fg">清除</button>}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* -------------------------------------------------------- DateRangePicker */

export interface RangePreset { label: string; range: () => DateRange }

/** 默认快捷范围：截止到今天。 */
export const RANGE_PRESETS: RangePreset[] = [
  { label: '今天', range: () => ({ from: today(), to: today() }) },
  { label: '昨天', range: () => ({ from: subDays(today(), 1), to: subDays(today(), 1) }) },
  { label: '近 7 天', range: () => ({ from: subDays(today(), 6), to: today() }) },
  { label: '近 30 天', range: () => ({ from: subDays(today(), 29), to: today() }) },
  { label: '近 90 天', range: () => ({ from: subDays(today(), 89), to: today() }) },
  { label: '本月', range: () => ({ from: startOfMonth(today()), to: today() }) },
  { label: '上月', range: () => ({ from: startOfMonth(subMonths(today(), 1)), to: endOfMonth(subMonths(today(), 1)) }) },
];

const sameRange = (a?: DateRange, b?: DateRange) => !!a && !!b && isSameDay(a.from, b.from) && isSameDay(a.to, b.to);

export interface DateRangePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  /** 左侧快捷范围；传 false 关闭。 */
  presets?: RangePreset[] | false;
  placeholder?: string;
  min?: Date;
  max?: Date;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  defaultOpen?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * 日期范围。左侧快捷范围，右侧两个月并排；第一次点击定开始日，第二次点击定结束日并关闭。
 * 选中的是快捷范围时，触发器显示它的名字（「近 30 天」）。
 */
/** 打开时的两个月：有值时左边是开始月、右边是结束月（同月则右边下一个月）；没值时是上个月和本月。 */
function initialMonths(r?: DateRange): [Date, Date] {
  if (!r) { const m = startOfMonth(today()); return [subMonths(m, 1), m]; }
  const l = startOfMonth(r.from);
  return [l, isSameMonth(r.from, r.to) ? addMonths(l, 1) : startOfMonth(r.to)];
}

export function DateRangePicker({
  value, defaultValue, onValueChange, presets = RANGE_PRESETS, placeholder = '选择日期范围', min, max, size = 'md', invalid, disabled, clearable = true, defaultOpen = false, className, ...aria
}: DateRangePickerProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const cur = value !== undefined ? value : inner;
  const [open, setOpen] = React.useState(defaultOpen);
  const [draft, setDraft] = React.useState<{ from?: Date; to?: Date }>(() => (cur ? { from: cur.from, to: cur.to } : {}));
  const [hover, setHover] = React.useState<Date>();
  // 左右两个月各自翻页、互不带动；左边始终早于右边
  const [months, setMonths] = React.useState<[Date, Date]>(() => initialMonths(cur));
  const [focus, setFocus] = React.useState(cur?.to ?? today());
  const ref = React.useRef<HTMLDivElement>(null);

  const set = (r?: DateRange) => { setInner(r); onValueChange?.(r); };
  const onOpen = (o: boolean) => {
    setOpen(o);
    if (o) { setDraft(cur ? { from: cur.from, to: cur.to } : {}); setMonths(initialMonths(cur)); setFocus(cur?.to ?? today()); }
  };
  const pick = (d: Date) => {
    if (!draft.from || draft.to) { setDraft({ from: d }); return; }
    const [a, b] = isBefore(d, draft.from) ? [d, draft.from] : [draft.from, d];
    set({ from: a, to: b }); setDraft({ from: a, to: b }); setOpen(false);
  };
  const moveFocus = (d: Date) => {
    const [l, r] = months;
    const m = startOfMonth(d);
    if (!isSameMonth(d, l) && !isSameMonth(d, r)) {
      // 键盘移出当前显示的月份：往前翻动左边，往后翻动右边
      if (isBefore(d, focus)) setMonths(isBefore(m, r) ? [m, r] : [subMonths(m, 1), m]);
      else setMonths(isAfter(m, l) ? [l, m] : [m, addMonths(m, 1)]);
    }
    setFocus(d);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>(`[data-date="${fmt(d)}"]`)?.focus());
  };
  const active = presets ? presets.find((p) => sameRange(p.range(), cur)) : undefined;
  const text = cur ? (active ? `${active.label}` : `${fmt(cur.from)} 至 ${fmt(cur.to)}`) : undefined;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Trigger open={open} text={text} placeholder={placeholder} size={size} invalid={invalid} disabled={disabled}
          clearable={clearable} onClear={() => set(undefined)} className={className} aria-label={aria['aria-label']}
          title={cur && active ? `${fmt(cur.from)} 至 ${fmt(cur.to)}` : undefined} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={4} collisionPadding={8} className={cn(panelClass, 'flex')}
          onOpenAutoFocus={(e) => e.preventDefault()}>
          {presets && (
            <div className="flex w-28 shrink-0 flex-col gap-px border-r border-border-subtle p-1.5">
              {presets.map((p) => {
                const on = sameRange(p.range(), draft.from && draft.to ? (draft as DateRange) : cur);
                return (
                  <button key={p.label} type="button" onClick={() => { const r = p.range(); set(r); setOpen(false); }}
                    className={cn('flex h-8 cursor-pointer items-center rounded-sm px-2.5 text-left text-body-sm outline-none focus-visible:shadow-focus-ring',
                      on ? 'bg-surface-selected font-medium text-primary-hover' : 'text-fg hover:bg-surface-hover')}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
          <div ref={ref} className="flex flex-col gap-1.5 p-3">
            <div className="flex gap-6">
              {months.map((m, i) => {
                const other = months[1 - i];
                const target = (n: number) => addMonths(m, n);
                const canGo = (n: number) => (i === 0 ? isBefore(target(n), other) : isAfter(target(n), other));
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <MonthHeader month={m} canGo={canGo} onGo={(n) => setMonths(i === 0 ? [target(n), other] : [other, target(n)])} />
                    <Month month={m} range={draft} hover={draft.from && !draft.to ? hover : undefined} min={min} max={max}
                      focusDate={focus} onFocusDate={moveFocus} onPick={pick} onHover={setHover} />
                  </div>
                );
              })}
            </div>
            <div className="flex h-7 items-center justify-between border-t border-border-subtle pt-2 text-body-sm tabular-nums">
              <span className={cn(draft.from ? 'text-fg' : 'text-fg-subtle')}>
                {draft.from ? fmt(draft.from) : '开始日期'}<span className="mx-1.5 text-fg-subtle">至</span>{draft.to ? fmt(draft.to) : hover && draft.from ? fmt(hover) : '结束日期'}
              </span>
              {cur && clearable && <button type="button" onClick={() => { set(undefined); setDraft({}); }} className="h-7 cursor-pointer rounded-sm px-2 text-fg-muted hover:bg-surface-hover hover:text-fg">清除</button>}
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
