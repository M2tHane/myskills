import * as React from 'react';
import { Check, CornerDownRight, ShieldAlert, ShieldCheck, ShieldX, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/*
 * LLM 反过来问用户：AskPrompt（让用户选）、ApprovalPrompt（执行前请用户确认）。
 * 两者都放在对话底部（ChatDock 里），出现时代替输入框，处理完再换回输入框；处理结果用 AskRecord / ApprovalRecord 留在消息里。
 * 卡片用浮起材质（shadow-raised）表示「在等你」，不用弹窗遮住对话——用户要能往上翻看上下文再回答。
 */

/* ------------------------------------------------------------------ 提问 */

export interface AskOption {
  value: string;
  label: string;
  /** 选项的补充，一行；能不写就不写。 */
  description?: string;
}

export interface AskQuestion {
  id: string;
  /** 多个问题时，顶部标签上的短名（2–6 个字）。 */
  header?: string;
  question: string;
  options: AskOption[];
  /** 可多选。 */
  multiple?: boolean;
  /** 最后加一个「其他」，选中后出现输入框。默认 true；传字符串作为输入框的占位文字。 */
  other?: boolean | string;
}

export interface AskAnswer { values: string[]; other?: string }

export interface AskPromptProps {
  questions: AskQuestion[];
  onSubmit?: (answers: Record<string, AskAnswer>) => void;
  /** 传了就有「跳过」，Esc 也是跳过。 */
  onSkip?: () => void;
  submitLabel?: string;
  /** 预先选好的答案（如上次的选择）；「其他」的值写 `'__other__'` 并给 other 文字。 */
  defaultAnswers?: Record<string, AskAnswer>;
  /** 一开始显示第几个问题（从 0 开始）。 */
  defaultIndex?: number;
  className?: string;
}

export const ASK_OTHER = '__other__';
const OTHER = ASK_OTHER;

/**
 * 提问选择框。每个选项一行，左侧是编号（单选）或复选框（多选），选中的行浅蓝底 + 蓝边框。
 * 键盘：数字键选中对应选项，Enter 下一题 / 提交，Esc 跳过。多个问题时顶部是标签，答过的打勾。
 */
export function AskPrompt({ questions, onSubmit, onSkip, submitLabel = '提交', defaultAnswers = {}, defaultIndex = 0, className }: AskPromptProps) {
  const [idx, setIdx] = React.useState(defaultIndex);
  const [answers, setAnswers] = React.useState<Record<string, AskAnswer>>(defaultAnswers);
  const root = React.useRef<HTMLDivElement>(null);
  const otherInput = React.useRef<HTMLInputElement>(null);
  const q = questions[idx];
  const last = idx === questions.length - 1;
  const allowOther = q.other !== false;
  const opts: AskOption[] = allowOther ? [...q.options, { value: OTHER, label: '其他' }] : q.options;

  const done = (qq: AskQuestion) => {
    const a = answers[qq.id];
    if (!a?.values.length) return false;
    return !a.values.includes(OTHER) || !!a.other?.trim();
  };
  const toggle = (value: string) => {
    const cur = answers[q.id]?.values ?? [];
    const values = q.multiple ? (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]) : [value];
    setAnswers({ ...answers, [q.id]: { ...answers[q.id], values } });
    if (value === OTHER && values.includes(OTHER)) requestAnimationFrame(() => otherInput.current?.focus());
  };
  const next = () => {
    if (!done(q)) return;
    if (!last) { setIdx(idx + 1); requestAnimationFrame(() => root.current?.focus()); return; }
    const out: Record<string, AskAnswer> = {};
    for (const qq of questions) {
      const a = answers[qq.id] ?? { values: [] };
      out[qq.id] = { values: a.values.filter((v) => v !== OTHER), other: a.values.includes(OTHER) ? a.other?.trim() : undefined };
    }
    onSubmit?.(out);
  };

  React.useEffect(() => { root.current?.focus({ preventScroll: true }); }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const typing = (e.target as HTMLElement).tagName === 'INPUT';
    if (e.key === 'Escape' && onSkip) { e.preventDefault(); onSkip(); return; }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); next(); return; }
    if (!typing && /^[1-9]$/.test(e.key)) {
      const o = opts[Number(e.key) - 1];
      if (o) { e.preventDefault(); toggle(o.value); }
    }
  };

  const sel = answers[q.id]?.values ?? [];
  return (
    <div ref={root} tabIndex={-1} onKeyDown={onKey} role="group" aria-label={q.question}
      className={cn('flex animate-rise-in flex-col overflow-hidden rounded-md border border-border bg-surface font-sans shadow-raised outline-none', className)}>
      {questions.length > 1 && (
        <div className="flex h-10 items-center gap-1 border-b border-border-subtle px-2">
          {questions.map((qq, i) => (
            <button key={qq.id} type="button" onClick={() => setIdx(i)} aria-current={i === idx || undefined}
              className={cn('inline-flex h-7 cursor-pointer items-center gap-1 rounded-sm px-2 text-body-sm outline-none focus-visible:shadow-focus-ring [&_svg]:size-3.5',
                i === idx ? 'bg-surface-selected font-medium text-primary-hover' : 'text-fg-muted hover:bg-surface-hover hover:text-fg')}>
              {done(qq) && i !== idx && <Check className="text-success" strokeWidth={2.5} />}
              {qq.header ?? `问题 ${i + 1}`}
            </button>
          ))}
          <span className="flex-1" />
          <span className="pr-1 text-caption text-fg-subtle tabular-nums">{idx + 1} / {questions.length}</span>
        </div>
      )}
      <div className="flex flex-col gap-2.5 px-3 pt-3 pb-3">
        <div className="px-1 text-body font-medium text-fg">{q.question}</div>
        <div role={q.multiple ? 'group' : 'radiogroup'} className="flex flex-col gap-1.5">
          {opts.map((o, i) => {
            const on = sel.includes(o.value);
            return (
              <div key={o.value}
                role={q.multiple ? 'checkbox' : 'radio'} aria-checked={on} tabIndex={0}
                onClick={() => toggle(o.value)}
                onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); toggle(o.value); } }}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2 outline-none transition-colors duration-100 focus-visible:shadow-focus-ring',
                  on ? 'border-primary-line bg-primary-soft' : 'border-border hover:bg-surface-hover',
                )}>
                {q.multiple ? (
                  <span className={cn('mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-xs border [&_svg]:size-3',
                    on ? 'border-primary-hover bg-primary text-primary-fg shadow-primary' : 'border-border-strong bg-surface')}>
                    {on && <Check strokeWidth={3} />}
                  </span>
                ) : (
                  <span className={cn('mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-xs font-mono text-micro font-semibold tabular-nums',
                    on ? 'bg-primary text-primary-fg shadow-primary' : 'border border-border bg-surface-sunken text-fg-muted')}>
                    {i + 1}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-body-sm text-fg', on && 'font-medium')}>{o.label}</span>
                  {o.description && <span className="text-caption text-fg-muted">{o.description}</span>}
                  {o.value === OTHER && on && (
                    <input ref={otherInput} value={answers[q.id]?.other ?? ''} onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: { values: sel, other: e.target.value } })}
                      placeholder={typeof q.other === 'string' ? q.other : '输入你的回答'}
                      className="mt-1.5 h-(--control-sm) w-full rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm text-fg shadow-inset outline-none placeholder:text-fg-subtle focus:border-ring focus:shadow-focus-input" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex h-12 items-center gap-2 border-t border-border-subtle px-3">
        {onSkip && <Button size="sm" variant="ghost" onClick={onSkip}>跳过</Button>}
        <span className="flex-1" />
        {idx > 0 && <Button size="sm" onClick={() => setIdx(idx - 1)}>上一题</Button>}
        <Button size="sm" variant="default" disabled={!done(q)} onClick={next}>{last ? submitLabel : '下一题'}</Button>
      </div>
    </div>
  );
}

/** 回答之后留在消息里的记录：每个问题一行「问题 → 回答」。 */
export function AskRecord({ items, skipped }: { items?: Array<{ question: React.ReactNode; answer: React.ReactNode }>; skipped?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border-subtle bg-surface-sunken px-3 py-2 text-body-sm">
      {skipped ? <span className="text-fg-muted">已跳过提问</span> : (items ?? []).map((it, i) => (
        <div key={i} className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 truncate text-fg-muted">{it.question}</span>
          <CornerDownRight className="size-3.5 shrink-0 translate-y-0.5 text-fg-subtle" />
          <span className="min-w-0 font-medium text-fg">{it.answer}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ 执行确认 */

export interface ApprovalPromptProps {
  /** 一句话：「允许删除 3 个查询？」。 */
  title: React.ReactNode;
  /** 工具名，等宽显示。 */
  tool?: string;
  /** 将要执行的内容（参数、SQL），等宽显示，最高 160 后滚动。 */
  detail?: string;
  /** 补充事实，如影响范围（一行）。 */
  children?: React.ReactNode;
  /** 不可撤销的操作：图标变红，允许按钮用危险色。 */
  danger?: boolean;
  onDeny?: () => void;
  onApprove?: (scope: 'once' | 'always') => void;
  /** 显示「以后都允许」（同一个工具不再询问）。危险操作默认不显示。 */
  allowAlways?: boolean;
  approveLabel?: string;
  className?: string;
}

/** 执行确认：Agent 要调用有副作用的工具前请用户确认。Enter 允许本次，Esc 拒绝。 */
export function ApprovalPrompt({
  title, tool, detail, children, danger, onDeny, onApprove, allowAlways = !danger, approveLabel = '允许', className,
}: ApprovalPromptProps) {
  const root = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { root.current?.focus({ preventScroll: true }); }, []);
  return (
    <div ref={root} tabIndex={-1} role="alertdialog" aria-label={typeof title === 'string' ? title : '执行确认'}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); onDeny?.(); }
        else if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); onApprove?.('once'); }
      }}
      className={cn('flex animate-rise-in flex-col overflow-hidden rounded-md border border-border bg-surface font-sans shadow-raised outline-none', className)}>
      <div className="flex gap-3 px-4 pt-3.5 pb-3">
        <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-sm [&_svg]:size-4',
          danger ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>
          {danger ? <TriangleAlert /> : <ShieldAlert />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-h-8 flex-col justify-center">
            <div className="text-body font-medium text-fg">{title}</div>
            {tool && <div className="font-mono text-caption text-fg-subtle">{tool}</div>}
          </div>
          {detail != null && (
            <pre className="m-0 max-h-40 overflow-auto rounded-xs border border-border-subtle bg-surface-sunken px-2.5 py-2 font-mono text-code break-all whitespace-pre-wrap text-fg">{detail}</pre>
          )}
          {children != null && <div className="text-body-sm text-fg">{children}</div>}
        </div>
      </div>
      <div className="flex h-12 items-center gap-2 border-t border-border-subtle px-3">
        {allowAlways && <Button size="sm" variant="ghost" onClick={() => onApprove?.('always')}>以后都允许</Button>}
        <span className="flex-1" />
        <Button size="sm" onClick={onDeny}>拒绝</Button>
        <Button size="sm" variant={danger ? 'destructive' : 'default'} onClick={() => onApprove?.('once')}>{approveLabel}</Button>
      </div>
    </div>
  );
}

/** 确认之后留在消息里的一行：已允许 / 已拒绝。 */
export function ApprovalRecord({ approved, children }: { approved: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-body-sm">
      {approved ? <ShieldCheck className="size-4 text-success" /> : <ShieldX className="size-4 text-danger" />}
      <span className="text-fg-muted">{approved ? '已允许' : '已拒绝'}</span>
      {children != null && <span className="min-w-0 truncate text-fg">{children}</span>}
    </div>
  );
}
