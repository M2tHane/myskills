import * as React from 'react';
import { ArrowDown, Check, ChevronRight, CircleAlert, Copy, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Spinner } from './spinner';

/*
 * 对话（与 LLM / Agent）：ChatThread 是可滚动的消息区，内容居中、宽 --chat-width；底部放 ChatDock（输入框或提问框）。
 * 消息不放头像：用户的话是右侧浅灰气泡，助手的回答是左侧无底色的正文。蓝色只留给发送按钮和需要用户处理的提问。
 */

/* ------------------------------------------------------------------ 消息区 */

export interface ChatThreadProps {
  children?: React.ReactNode;
  className?: string;
  /** 内容区（居中那一列）的样式。 */
  contentClassName?: string;
}

/**
 * 消息区：占满剩余高度、自己滚动。停在底部时，新内容（包括流式输出）会自动跟到底；
 * 用户往上翻看时不打扰，底部出现「回到底部」按钮。
 */
export function ChatThread({ children, className, contentClassName }: ChatThreadProps) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const stick = React.useRef(true);
  const lastTop = React.useRef(0);
  const [atBottom, setAtBottom] = React.useState(true);
  const toBottom = (smooth = false) => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); };

  React.useLayoutEffect(() => {
    toBottom();
    if (typeof ResizeObserver === 'undefined' || !inner.current) return;
    // 内容变长（流式输出）或可视区变矮（底部换成更高的提问框）时，停在底部就继续跟到底
    const ro = new ResizeObserver(() => { if (stick.current) toBottom(); });
    ro.observe(inner.current);
    if (scroller.current) ro.observe(scroller.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto"
        // 只有用户自己往上翻（滚轮向上、或滚动位置变小）才停止跟随；内容一次长很多不会误判
        onWheel={(e) => { if (e.deltaY < 0 && stick.current) { stick.current = false; setAtBottom(false); } }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          const up = el.scrollTop < lastTop.current - 2;
          lastTop.current = el.scrollTop;
          if (near) stick.current = true; else if (up) stick.current = false;
          if (stick.current !== atBottom) setAtBottom(stick.current);
        }}>
        <div ref={inner} role="log" aria-live="polite" className={cn('mx-auto flex w-full max-w-(--chat-width) flex-col gap-7 px-6 pt-6 pb-6', contentClassName)}>
          {children}
        </div>
      </div>
      {!atBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <IconButton icon={<ArrowDown />} label="回到底部" variant="outline" size="sm" tooltip={false}
            className="pointer-events-auto rounded-full shadow-raised" onClick={() => { stick.current = true; toBottom(true); }} />
        </div>
      )}
    </div>
  );
}

/** 消息区底部：输入框、提问框、执行确认放在这里，与消息同宽；离底部留 32px，不贴着页面底边。 */
export function ChatDock({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-(--chat-width) shrink-0 px-6 pt-1 pb-8', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ 单条消息 */

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  children?: React.ReactNode;
  /** 附件（FileChip），用户消息显示在气泡上方，助手消息显示在正文下方。 */
  attachments?: React.ReactNode;
  /** 消息下方的操作（CopyButton、重新生成等）。 */
  actions?: React.ReactNode;
  /** hover：悬停这条消息才出现（默认）；always：始终显示（最后一条助手消息）。 */
  showActions?: 'hover' | 'always';
  className?: string;
}

export function ChatMessage({ role, children, attachments, actions, showActions = 'hover', className }: ChatMessageProps) {
  // 悬停才出现的操作浮在消息下方的间距里，不占高度；始终显示的（最后一条）占一行
  const bar = actions != null && (
    <div className={cn('flex items-center gap-0.5 transition-opacity duration-100',
      showActions === 'hover' && 'absolute top-full mt-0.5 opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100',
      role === 'assistant' ? '-ml-1.5 left-0' : '-mr-1.5 right-0')}>
      {actions}
    </div>
  );
  if (role === 'user') {
    return (
      <div className={cn('group/msg relative flex flex-col items-end gap-1.5', className)}>
        {attachments != null && <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">{attachments}</div>}
        {children != null && (
          <div className="max-w-[85%] rounded-md bg-surface-active px-3.5 py-2 text-body break-words whitespace-pre-wrap text-fg">{children}</div>
        )}
        {bar}
      </div>
    );
  }
  return (
    <div className={cn('group/msg relative flex min-w-0 flex-col gap-3 text-body text-fg', className)}>
      {children}
      {attachments != null && <div className="flex flex-wrap gap-1.5">{attachments}</div>}
      {bar}
    </div>
  );
}

/** 复制按钮：点了图标变成对勾 1.5 秒。 */
export function CopyButton({ text, label = '复制' }: { text: string | (() => string); label?: string }) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1500); return () => clearTimeout(t); }, [done]);
  return (
    <IconButton size="sm" label={done ? '已复制' : label} icon={done ? <Check /> : <Copy />}
      onClick={() => { void navigator.clipboard?.writeText(typeof text === 'function' ? text() : text).catch(() => {}); setDone(true); }} />
  );
}

/** 消息下方的「重新生成」。 */
export function RetryButton({ onClick, label = '重新生成' }: { onClick?: () => void; label?: string }) {
  return <IconButton size="sm" label={label} icon={<RotateCw />} onClick={onClick} />;
}

/* ------------------------------------------------------------------ 状态与过程 */

function useElapsed(since?: number) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { if (since == null) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [since]);
  return since == null ? undefined : Math.max(0, Math.floor((now - since) / 1000));
}

/** 进行中的状态行：正在思考、正在查询。传 `since`（开始时间戳）显示已用秒数。 */
export function ChatStatus({ children = '正在思考', since, className }: { children?: React.ReactNode; since?: number; className?: string }) {
  const s = useElapsed(since);
  return (
    <div role="status" className={cn('flex h-6 items-center gap-2 text-body-sm text-fg-muted', className)}>
      <Spinner className="size-3.5" />
      <span>{children}</span>
      {s != null && s > 0 && <span className="text-fg-subtle tabular-nums">{s} 秒</span>}
    </div>
  );
}

export interface ReasoningProps {
  children?: React.ReactNode;
  /** 进行中：标题是「正在思考」并转圈；结束后是「已思考 N 秒」，默认收起。 */
  running?: boolean;
  seconds?: number;
  since?: number;
  defaultOpen?: boolean;
}

/** 思考过程：一行可展开的标题，展开后是左侧细线的过程文字。 */
export function Reasoning({ children, running, seconds, since, defaultOpen = false }: ReasoningProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const s = useElapsed(running ? since : undefined) ?? seconds;
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className="-ml-1 inline-flex h-6 w-fit cursor-pointer items-center gap-1.5 rounded-xs px-1 text-body-sm text-fg-muted outline-none hover:text-fg focus-visible:shadow-focus-ring">
        {running && <Spinner className="size-3.5" />}
        <span>{running ? '正在思考' : '已思考'}{s != null && s > 0 && <span className="tabular-nums"> {s} 秒</span>}</span>
        <ChevronRight className={cn('size-3.5 transition-transform duration-150', open && 'rotate-90')} />
      </button>
      {open && <div className="border-l-2 border-border pl-3 text-body-sm break-words whitespace-pre-wrap text-fg-muted">{children}</div>}
    </div>
  );
}

export type ToolStatus = 'pending' | 'running' | 'done' | 'error';

export interface ToolCallProps {
  /** 工具名，粗体显示：`run_sql`、`Bash`。 */
  name: string;
  /** 括号里的参数摘要，一行截断。不传时用 input 压成一行。 */
  args?: string;
  status?: ToolStatus;
  /** 「1.2 秒」，行尾灰字。 */
  duration?: React.ReactNode;
  /** 完整参数与结果，展开后用等宽字显示。 */
  input?: string;
  output?: string;
  /** status="error" 时的原因，展开后显示。 */
  error?: string;
  /** 给人看的动作（「查询订单数据」），悬停整行时显示。 */
  title?: string;
  defaultOpen?: boolean;
  /** 展开区里的自定义内容（表格预览等），放在参数和结果后面。 */
  children?: React.ReactNode;
}

/** 参数摘要：JSON 对象写成 `key: value, …`，其他文字压成一行。 */
function summarize(input?: string): string {
  const raw = (input ?? '').trim();
  if (raw.startsWith('{')) {
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      if (o && typeof o === 'object' && !Array.isArray(o)) return Object.entries(o).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    } catch { /* 不是合法 JSON，按文字处理 */ }
  }
  return raw.replace(/\s+/g, ' ');
}

const DOT: Record<ToolStatus, string> = {
  pending: 'bg-fg-disabled',
  running: 'bg-primary animate-caret',
  done: 'bg-success',
  error: 'bg-danger',
};

/**
 * 工具调用：一行等宽字「● tool_call: run_sql(SELECT region, SUM(…)…)」。
 * 圆点表示状态（灰：等待、蓝闪：运行中、绿：完成、红：失败），工具名粗体，括号里是参数摘要，过长截断。
 * 点一下展开完整的参数和结果，再点收起。连续多个直接上下排列。
 */
export function ToolCall({ name, args, status = 'done', duration, input, output, error, title, defaultOpen = false, children }: ToolCallProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const summary = args ?? summarize(input);
  const body = input != null || output != null || error != null || children != null;
  return (
    <div className="flex min-w-0 flex-col">
      <button type="button" aria-expanded={body ? open : undefined} disabled={!body} onClick={() => setOpen(!open)} title={title}
        className="-mx-1.5 flex h-7 min-w-0 cursor-pointer items-center gap-2 rounded-xs px-1.5 text-left font-mono text-code outline-none hover:bg-surface-hover focus-visible:shadow-focus-ring disabled:cursor-default disabled:hover:bg-transparent">
        <span aria-label={{ pending: '等待', running: '运行中', done: '完成', error: '失败' }[status]} className={cn('size-2 shrink-0 rounded-full', DOT[status])} />
        <span className="shrink-0 text-fg-subtle">tool_call:</span>
        <span className="flex min-w-0 flex-1 items-baseline">
          <span className="shrink-0 font-semibold text-fg">{name}</span>
          <span className="min-w-0 truncate text-fg-muted">({summary})</span>
        </span>
        {duration != null && <span className="shrink-0 font-sans text-caption text-fg-subtle tabular-nums">{duration}</span>}
      </button>
      {open && body && (
        <div className="mt-1 mb-1 ml-1 flex flex-col gap-2 border-l-2 border-border pl-3.5">
          {input != null && <ToolSection label="参数" text={input} />}
          {output != null && <ToolSection label="结果" text={output} />}
          {error != null && <ToolSection label="错误" text={error} danger />}
          {children}
        </div>
      )}
    </div>
  );
}

function ToolSection({ label, text, danger }: { label: string; text: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-medium text-fg-muted">{label}</span>
      <pre className={cn('m-0 max-h-72 overflow-auto rounded-xs bg-surface-sunken px-2.5 py-2 font-mono text-code break-all whitespace-pre-wrap',
        danger ? 'text-danger' : 'text-fg')}>{text}</pre>
    </div>
  );
}

/** 生成失败：一行红色提示 + 「重试」。 */
export function ChatError({ children, onRetry }: { children?: React.ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex min-h-10 items-center gap-2.5 rounded-sm border border-danger-line bg-danger-soft py-1.5 pr-1.5 pl-3 text-body-sm">
      <CircleAlert className="size-4 shrink-0 text-danger" />
      <span className="min-w-0 flex-1 text-fg">{children}</span>
      {onRetry && <Button size="sm" leftIcon={<RotateCw />} onClick={onRetry}>重试</Button>}
    </div>
  );
}

/** 用户按了「停止」后，留在消息末尾的一行。 */
export function ChatStopped({ children = '已停止生成' }: { children?: React.ReactNode }) {
  return <div className="text-body-sm text-fg-subtle">{children}</div>;
}

/* ------------------------------------------------------------------ 新对话 */

export interface ChatSuggestion { label: string; icon?: React.ReactNode; prompt?: string }

/** 新对话的起始页：一个标题 + 2–4 个可以直接点的问题。没有插画、没有渐变。 */
export function ChatWelcome({ title, suggestions = [], onPick, className }: {
  title: React.ReactNode; suggestions?: ChatSuggestion[]; onPick?: (s: ChatSuggestion) => void; className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5 pt-[12vh]', className)}>
      <h2 className="m-0 text-title-2 font-semibold tracking-[-0.01em] text-fg">{title}</h2>
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((s) => (
            <button key={s.label} type="button" onClick={() => onPick?.(s)}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm border border-border bg-surface px-3 py-2 text-left text-body-sm text-fg shadow-xs outline-none hover:border-border-strong hover:bg-surface-hover focus-visible:shadow-focus-ring [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle">
              {s.icon}<span className="min-w-0">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ 正文排版 */

const prose = [
  'min-w-0 text-body text-fg break-words',
  '[&>*]:my-0 [&>*+*]:mt-3',
  '[&_h1]:text-title-3 [&_h1]:font-semibold [&_h2]:text-title-3 [&_h2]:font-semibold [&_h3]:text-body [&_h3]:font-semibold [&_:is(h1,h2,h3)+*]:mt-1.5',
  '[&_strong]:font-semibold',
  '[&_a]:text-link [&_a]:no-underline hover:[&_a]:underline',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:pl-5 [&_li]:pl-0.5 [&_li+li]:mt-1 [&_li>:is(ul,ol)]:mt-1 [&_li::marker]:text-fg-subtle',
  '[&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-surface-active [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-px [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-code',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-fg-muted',
  '[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border-subtle',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-body-sm [&_th]:bg-surface-sunken [&_th]:text-left [&_th]:font-medium [&_th]:text-fg-muted',
  '[&_:is(th,td)]:border [&_:is(th,td)]:border-border [&_:is(th,td)]:px-2.5 [&_:is(th,td)]:py-1.5 [&_td]:tabular-nums',
];

/**
 * 助手回答的正文排版：段落、标题、列表、行内代码、引用、表格。
 * 用 react-markdown 等库渲染 Markdown 时，把结果包在 Prose 里即可；原型里用下面的 Markdown。
 */
export function Prose({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn(prose, className)}>{children}</div>;
}

/** 代码块：顶部一行语言名 + 复制，下面等宽字可横向滚动。 */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="flex h-8 items-center justify-between border-b border-border-subtle bg-surface-sunken pr-1 pl-3">
        <span className="font-mono text-caption text-fg-subtle">{lang || 'text'}</span>
        <CopyButton text={code} label="复制代码" />
      </div>
      <pre className="m-0 overflow-x-auto bg-surface px-3 py-2.5 font-mono text-code text-fg [font-variant-ligatures:none]"><code>{code}</code></pre>
    </div>
  );
}

/** 流式输出时跟在最后一个字后面的光标。 */
export function StreamingCaret() {
  return <span aria-hidden className="ml-0.5 inline-block h-[1.05em] w-[0.45em] translate-y-[0.15em] animate-caret rounded-[1px] bg-fg-muted" />;
}

/* ------------------------------------------------------------------ 简化 Markdown（原型用） */

type Block =
  | { t: 'p' | 'h1' | 'h2' | 'h3' | 'quote'; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'code'; lang: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'hr' };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let i = 0;
  const row = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const fence = /^```(\S*)/.exec(l.trim());
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) body.push(lines[i++]);
      i++;
      out.push({ t: 'code', lang: fence[1], code: body.join('\n') });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) { out.push({ t: (['h1', 'h2', 'h3'] as const)[h[1].length - 1], text: h[2] }); i++; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(l.trim())) { out.push({ t: 'hr' }); i++; continue; }
    if (l.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const head = row(l);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(row(lines[i++]));
      out.push({ t: 'table', head, rows });
      continue;
    }
    const list = /^\s*([-*]|\d+[.)])\s+/.exec(l);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+[.)])\s+/, ''));
      out.push({ t: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (l.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push({ t: 'quote', text: q.join('\n') });
      continue;
    }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|\s*([-*]|\d+[.)])\s|>|\|)/.test(lines[i])) p.push(lines[i++]);
    if (!p.length) p.push(lines[i++]);
    out.push({ t: 'p', text: p.join('\n') });
  }
  return out;
}

function inline(text: string, key = ''): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const s = m[0];
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k}>{s.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k}>{s.slice(2, -2)}</strong>);
    else { const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(s)!; out.push(<a key={k} href={lm[2]} target="_blank" rel="noreferrer">{lm[1]}</a>); }
    last = m.index + s.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * 简化版 Markdown：段落、### 标题、列表、``` 代码块、表格、引用、**粗体**、`代码`、[链接](url)。
 * 只给原型用（假数据里的回答是字符串）；真实开发换成 react-markdown + remark-gfm，外面照样包 Prose。
 * `streaming` 时在最后一个字后面显示光标；没写完的代码块也能正常显示。
 */
export function Markdown({ children, streaming, className }: { children: string; streaming?: boolean; className?: string }) {
  const blocks = React.useMemo(() => parse(children), [children]);
  const caret = streaming ? <StreamingCaret key="caret" /> : null;
  return (
    <Prose className={className}>
      {blocks.map((b, i) => {
        const end = i === blocks.length - 1 ? caret : null;
        switch (b.t) {
          case 'p': return <p key={i} className="whitespace-pre-wrap">{inline(b.text, String(i))}{end}</p>;
          case 'h1': return <h1 key={i}>{inline(b.text)}{end}</h1>;
          case 'h2': return <h2 key={i}>{inline(b.text)}{end}</h2>;
          case 'h3': return <h3 key={i}>{inline(b.text)}{end}</h3>;
          case 'quote': return <blockquote key={i} className="whitespace-pre-wrap">{inline(b.text)}{end}</blockquote>;
          case 'hr': return <hr key={i} />;
          case 'ul': case 'ol': {
            const L = b.t;
            return <L key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}{j === b.items.length - 1 ? end : null}</li>)}</L>;
          }
          case 'code': return <React.Fragment key={i}><CodeBlock code={b.code} lang={b.lang} />{end}</React.Fragment>;
          case 'table': return (
            <React.Fragment key={i}>
              <div className="overflow-x-auto"><table>
                <thead><tr>{b.head.map((h, j) => <th key={j}>{inline(h)}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
              </table></div>
              {end}
            </React.Fragment>
          );
        }
      })}
      {!blocks.length && caret && <p>{caret}</p>}
    </Prose>
  );
}
