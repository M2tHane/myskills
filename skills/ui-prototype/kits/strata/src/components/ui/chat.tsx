import * as React from 'react';
import { ArrowDown, Check, ChevronDown, ChevronRight, CircleAlert, CircleX, Copy, RotateCw } from 'lucide-react';
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

/** 消息区底部：输入框、提问框、执行确认放在这里，与消息同宽；输入框下方是一行工具（添加文件、模型），再往下离页面底边留 24px。 */
export function ChatDock({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-(--chat-width) shrink-0 px-6 pt-1 pb-6', className)}>{children}</div>;
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
  /** 一句话解释这一步在做什么：「查询上周各区域 GMV」「检查远端 main 并推送」。这是行上唯一显示的文字。 */
  title: React.ReactNode;
  /** 工具名，显示在展开后的 Request 标题旁：`run_sql`、`Bash`。 */
  name?: string;
  status?: ToolStatus;
  /** 「1.2 秒」，行尾灰字。 */
  duration?: React.ReactNode;
  /** 请求：命令、SQL、参数 JSON。展开后等宽显示。 */
  input?: string;
  /** 返回：输出、结果。展开后等宽显示。 */
  output?: string;
  /** status="error" 时的报错，显示在 Response 里（红字）。 */
  error?: string;
  defaultOpen?: boolean;
  /** 展开区里的自定义内容（表格预览、图片），放在 Response 后面。 */
  children?: React.ReactNode;
}

const InGroup = React.createContext(false);

/**
 * 一次工具调用 / 命令执行：一行简短的解释（灰字 + ›），点开显示 Request 和 Response 两块等宽文字。
 * 放在 ToolGroup 里时是组里的一行（行与行之间细线分隔）；单独放时没有边框，展开的内容在下方。
 * 运行中：解释前面转圈；失败：红色叉号，Response 里是报错。
 */
export function ToolCall({ title, name, status = 'done', duration, input, output, error, defaultOpen = false, children }: ToolCallProps) {
  const grouped = React.useContext(InGroup);
  const [open, setOpen] = React.useState(defaultOpen);
  const body = input != null || output != null || error != null || children != null;
  return (
    <div className={cn('flex min-w-0 flex-col', grouped && 'px-1.5')}>
      <button type="button" aria-expanded={body ? open : undefined} disabled={!body} onClick={() => setOpen(!open)}
        className={cn('group/tool flex min-w-0 cursor-pointer items-center gap-2 text-left font-sans text-body-sm outline-none focus-visible:shadow-focus-ring disabled:cursor-default',
          grouped ? 'min-h-10 rounded-sm px-2' : '-mx-1 min-h-7 w-fit max-w-full rounded-xs px-1')}>
        {status === 'running' && <Spinner className="size-3.5 shrink-0 text-fg-muted" />}
        {status === 'error' && <CircleX className="size-3.5 shrink-0 text-danger" />}
        {status === 'pending' && <span className="size-1.5 shrink-0 rounded-full bg-fg-disabled" />}
        <span className={cn('min-w-0 truncate group-hover/tool:text-fg group-disabled/tool:text-fg-muted', open ? 'text-fg' : 'text-fg-muted', status === 'error' && 'text-danger group-hover/tool:text-danger')}>{title}</span>
        {body && <ChevronRight className={cn('size-3.5 shrink-0 text-fg-subtle transition-transform duration-150', open && 'rotate-90')} />}
        {duration != null && <span className={cn('shrink-0 text-caption text-fg-subtle tabular-nums', grouped && 'ml-auto')}>{duration}</span>}
      </button>
      {open && body && (
        <div className={cn('flex flex-col gap-2', grouped ? 'px-2 pb-3' : 'mt-1 mb-1')}>
          {input != null && <ToolBlock label="Request" tag={name} text={input} />}
          {(output != null || error != null) && <ToolBlock label="Response" text={error ?? output ?? ''} danger={error != null} />}
          {children}
        </div>
      )}
    </div>
  );
}

function ToolBlock({ label, tag, text, danger }: { label: string; tag?: string; text: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-sm bg-surface-sunken px-3 pt-2 pb-2.5">
      <div className="flex items-center gap-2 text-caption text-fg-muted">
        <span className="font-medium">{label}</span>
        {tag && <span className="font-mono text-fg-subtle">{tag}</span>}
      </div>
      <pre className={cn('m-0 max-h-72 overflow-auto font-mono text-code break-all whitespace-pre-wrap [font-variant-ligatures:none]', danger ? 'text-danger' : 'text-fg')}>{text}</pre>
    </div>
  );
}

export interface ToolGroupProps {
  /** 折叠时的一句话：「运行了 2 条 SQL，读取了 1 个文件」「检查远端并推送，以及另外 3 步」。运行中写当前这一步的解释。 */
  summary: React.ReactNode;
  /** 运行中：标题前转圈，默认展开着让人看到进度。 */
  running?: boolean;
  defaultOpen?: boolean;
  /** ToolCall、ToolNote、ToolFile。 */
  children?: React.ReactNode;
}

/**
 * 一组连续的步骤（多条命令、读写文件、中间的思路）：折叠时只有一行「运行了 3 条命令 ⌄」，
 * 展开后是一个细边框的列表，每步一行、细线分隔，每行还能再点开看 Request / Response。一大段执行过程不占地方。
 */
export function ToolGroup({ summary, running, defaultOpen, children }: ToolGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className="group/tg -mx-1 flex min-h-7 w-fit max-w-full cursor-pointer items-center gap-2 rounded-xs px-1 text-left font-sans text-body-sm text-fg-muted outline-none hover:text-fg focus-visible:shadow-focus-ring">
        {running && <Spinner className="size-3.5 shrink-0" />}
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown className={cn('size-3.5 shrink-0 text-fg-subtle transition-transform duration-150', !open && '-rotate-90')} />
      </button>
      {open && (
        <InGroup.Provider value>
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface py-0">{children}</div>
        </InGroup.Provider>
      )}
    </div>
  );
}

/** 组里的一行思路 / 说明（不可点）：「先按区域汇总，再和前一周对比」。 */
export function ToolNote({ children }: { children?: React.ReactNode }) {
  return <div className="flex min-h-10 items-center px-3.5 py-2 text-body-sm text-fg-muted">{children}</div>;
}

/** 组里的一行文件操作：「已创建 model-picker.tsx」，可带右侧缩略图。 */
export function ToolFile({ action, name, thumb, onClick }: { action: React.ReactNode; name: string; thumb?: React.ReactNode; onClick?: () => void }) {
  const Root = onClick ? 'button' : 'div';
  return (
    <Root type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn('flex min-h-10 w-full items-center gap-2 px-3.5 py-1.5 text-left font-sans text-body-sm outline-none', onClick && 'cursor-pointer hover:bg-surface-hover focus-visible:shadow-focus-ring')}>
      <span className="text-fg-muted">{action}</span>
      <span className="min-w-0 truncate font-medium text-fg">{name}</span>
      {thumb && <span className="ml-auto h-8 w-12 shrink-0 overflow-hidden rounded-xs border border-border bg-surface-sunken">{thumb}</span>}
    </Root>
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
  // 文字类内容右侧留 48px，不铺满；代码块、表格（data-full）占满整行
  '[&>:not([data-full])]:mr-12',
  '[&_h1]:text-heading [&_h1]:font-semibold [&_h2]:text-title-3 [&_h2]:font-semibold [&_h3]:text-body [&_h3]:font-semibold [&_h4]:text-body-sm [&_h4]:font-semibold [&_h4]:text-fg-muted',
  '[&_:is(h1,h2,h3,h4)+*]:mt-1.5 [&>*+:is(h1,h2)]:mt-5 [&>*+:is(h3,h4)]:mt-4',
  '[&_strong]:font-semibold [&_em]:italic [&_del]:text-fg-muted [&_del]:line-through',
  '[&_a]:text-link [&_a]:no-underline hover:[&_a]:underline',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:pl-5 [&_li]:pl-0.5 [&_li+li]:mt-1 [&_li>:is(ul,ol)]:mt-1 [&_li::marker]:text-fg-subtle [&_ul_ul]:list-[circle]',
  '[&_li[data-task]]:-ml-5 [&_li[data-task]]:list-none [&_li[data-task]]:pl-0',
  '[&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-surface-active [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-px [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-code',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-fg-muted [&_blockquote>*+*]:mt-2',
  '[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border-subtle',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-body-sm [&_th]:bg-surface-sunken [&_th]:font-medium [&_th]:text-fg-muted',
  '[&_:is(th,td)]:border [&_:is(th,td)]:border-border [&_:is(th,td)]:px-2.5 [&_:is(th,td)]:py-1.5 [&_:is(th,td)]:text-left [&_td]:tabular-nums',
];

/**
 * 助手回答的正文排版：标题、段落、列表（可嵌套、任务列表）、粗体 / 斜体 / 删除线、行内代码、引用、表格、分隔线。
 * 文字右侧留 48px 不铺满；代码块和表格占满整行（加 `data-full`）。
 * 用 react-markdown 等库渲染时，把结果包在 Prose 里，代码块换成 CodeBlock、表格外包一层 `<div data-full>`。
 */
export function Prose({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn(prose, className)}>{children}</div>;
}

/** 代码块、命令：占满整行。顶部一行语言名 + 复制，下面等宽字可横向滚动。 */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div data-full className="overflow-hidden rounded-sm border border-border">
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

/* ------------------------------------------------------------------ Markdown（原型用） */

type Align = 'left' | 'center' | 'right' | undefined;
interface ListItem { text: string; task?: boolean; done?: boolean; children: Block[] }
type Block =
  | { t: 'p' | 'h1' | 'h2' | 'h3' | 'h4'; text: string }
  | { t: 'quote'; blocks: Block[] }
  | { t: 'ul' | 'ol'; start: number; items: ListItem[] }
  | { t: 'code'; lang: string; code: string }
  | { t: 'table'; head: string[]; align: Align[]; rows: string[][] }
  | { t: 'hr' };

const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const indentOf = (l: string) => l.replace(/\t/g, '    ').match(/^ */)![0].length;

function parseBlocks(lines: string[]): Block[] {
  const out: Block[] = [];
  let i = 0;
  const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const fence = /^\s*(```+|~~~+)\s*(\S*)/.exec(l);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      out.push({ t: 'code', lang: fence[2], code: body.join('\n') });
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l);
    if (h) { out.push({ t: (['h1', 'h2', 'h3', 'h4', 'h4', 'h4'] as const)[h[1].length - 1], text: h[2] }); i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push({ t: 'hr' }); i++; continue; }
    if (l.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = cells(l);
      const align = cells(lines[i + 1]).map((c): Align => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : undefined));
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push({ t: 'table', head, align, rows });
      continue;
    }
    if (/^\s*>/.test(l)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push({ t: 'quote', blocks: parseBlocks(q) });
      continue;
    }
    const lm = LIST.exec(l);
    if (lm) {
      const base = indentOf(l);
      const ordered = /\d/.test(lm[2]);
      const items: ListItem[] = [];
      while (i < lines.length) {
        const cur = lines[i];
        const m = LIST.exec(cur);
        if (m && indentOf(cur) === base && /\d/.test(m[2]) === ordered) {
          const task = /^\[([ xX])\]\s+(.*)$/.exec(m[3]);
          items.push({ text: task ? task[2] : m[3], task: !!task, done: task ? task[1] !== ' ' : undefined, children: [] });
          i++;
          // 缩进更深的行（子列表、续行）归到这一项
          const sub: string[] = [];
          while (i < lines.length && (lines[i].trim() === '' ? i + 1 < lines.length && indentOf(lines[i + 1]) > base : indentOf(lines[i]) > base)) sub.push(lines[i++]);
          if (sub.length) {
            const kids = parseBlocks(sub.map((x) => x.slice(Math.min(indentOf(x), base + 2))));
            const last = items[items.length - 1];
            if (kids[0]?.t === 'p') { last.text += ' ' + (kids.shift() as { text: string }).text; }
            last.children = kids;
          }
          continue;
        }
        break;
      }
      out.push({ t: ordered ? 'ol' : 'ul', start: ordered ? parseInt(lm[2], 10) : 1, items });
      continue;
    }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(```|~~~|#{1,6}\s|>|([-*+]|\d+[.)])\s)/.test(lines[i])
      && !(lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]))) p.push(lines[i++]);
    if (!p.length) p.push(lines[i++]);
    out.push({ t: 'p', text: p.join('\n') });
  }
  return out;
}

const INLINE = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*([^*]+?)\*\*|__([^_]+?)__|~~([^~]+?)~~|\*([^*\s][^*]*?)\*|(?<![\w])_([^_\s][^_]*?)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,，。;；:：!?！？])/g;

function inline(text: string, key = 'i'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  const re = new RegExp(INLINE.source, 'g');
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[2] != null) out.push(<code key={k}>{m[2]}</code>);
    else if (m[3] != null || m[4] != null) out.push(<strong key={k}>{inline(m[3] ?? m[4], k)}</strong>);
    else if (m[5] != null) out.push(<del key={k}>{inline(m[5], k)}</del>);
    else if (m[6] != null || m[7] != null) out.push(<em key={k}>{inline(m[6] ?? m[7], k)}</em>);
    else if (m[8] != null) out.push(<a key={k} href={m[9]} target="_blank" rel="noreferrer">{inline(m[8], k)}</a>);
    else out.push(<a key={k} href={m[10]} target="_blank" rel="noreferrer">{m[10]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderBlocks(blocks: Block[], caret: React.ReactNode, key = 'b'): React.ReactNode[] {
  return blocks.map((b, i) => {
    const k = `${key}-${i}`;
    const end = i === blocks.length - 1 ? caret : null;
    switch (b.t) {
      case 'p': return <p key={k} className="whitespace-pre-wrap">{inline(b.text, k)}{end}</p>;
      case 'h1': return <h1 key={k}>{inline(b.text, k)}{end}</h1>;
      case 'h2': return <h2 key={k}>{inline(b.text, k)}{end}</h2>;
      case 'h3': return <h3 key={k}>{inline(b.text, k)}{end}</h3>;
      case 'h4': return <h4 key={k}>{inline(b.text, k)}{end}</h4>;
      case 'hr': return <hr key={k} />;
      case 'quote': return <blockquote key={k}>{renderBlocks(b.blocks, end, k)}</blockquote>;
      case 'code': return <React.Fragment key={k}><CodeBlock code={b.code} lang={b.lang} />{end}</React.Fragment>;
      case 'ul': case 'ol': {
        const L = b.t;
        return (
          <L key={k} start={b.t === 'ol' && b.start !== 1 ? b.start : undefined}>
            {b.items.map((it, j) => {
              const lastItem = j === b.items.length - 1;
              return (
                <li key={j} data-task={it.task || undefined}>
                  {it.task && <span aria-hidden className={cn('mr-2 inline-flex size-3.5 translate-y-0.5 items-center justify-center rounded-xs border align-baseline [&_svg]:size-2.5',
                    it.done ? 'border-primary-hover bg-primary text-primary-fg' : 'border-border-strong bg-surface')}>{it.done && <Check strokeWidth={3.5} />}</span>}
                  <span className={cn(it.done && 'text-fg-muted')}>{inline(it.text, `${k}-${j}`)}</span>
                  {lastItem && !it.children.length ? end : null}
                  {it.children.length > 0 && renderBlocks(it.children, lastItem ? end : null, `${k}-${j}`)}
                </li>
              );
            })}
          </L>
        );
      }
      case 'table': return (
        <React.Fragment key={k}>
          <div data-full className="overflow-x-auto"><table>
            <thead><tr>{b.head.map((c, j) => <th key={j} style={b.align[j] ? { textAlign: b.align[j] } : undefined}>{inline(c, `${k}-h${j}`)}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{b.head.map((_, c) => <td key={c} style={b.align[c] ? { textAlign: b.align[c] } : undefined}>{inline(r[c] ?? '', `${k}-${j}-${c}`)}</td>)}</tr>)}</tbody>
          </table></div>
          {end}
        </React.Fragment>
      );
    }
  });
}

/**
 * Markdown 渲染（原型用，不依赖第三方库）：# 标题（1–4 级）、段落、无序 / 有序列表（可嵌套）、任务列表 `- [x]`、
 * ``` 代码块、表格（含对齐）、> 引用（可嵌套）、分隔线、**粗体**、*斜体*、~~删除线~~、`代码`、[链接](url) 和裸网址。
 * `streaming` 时在最后一个字后面显示光标；写到一半的代码块、表格也能正常显示。真实开发可以换成 react-markdown + remark-gfm，外面照样包 Prose。
 */
export function Markdown({ children, streaming, className }: { children: string; streaming?: boolean; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(children.replace(/\r\n?/g, '\n').split('\n')), [children]);
  const caret = streaming ? <StreamingCaret key="caret" /> : null;
  return (
    <Prose className={className}>
      {renderBlocks(blocks, caret)}
      {!blocks.length && caret && <p>{caret}</p>}
    </Prose>
  );
}
