import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronDown, Database, Ellipsis, PanelRight, PanelRightClose, Pencil, Search, SquarePen, Trash2 } from 'lucide-react';
import {
  ApprovalPrompt, ApprovalRecord, AskPrompt, AskRecord, Button, ChatDock, ChatError, ChatMessage, ChatStatus, ChatStopped, ChatThread,
  ChatWelcome, Composer, CopyButton, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, EmptyState, FileChip, FileTree, IconButton, Input, Markdown, ModelPicker, Reasoning, RetryButton, Skeleton, ToolCall, ToolGroup, toast,
  type FileNode,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  models, suggestions, toolSummary, useChatRun, useConversations, useMessages, useWorkspaceFiles,
  type ChatFile, type ChatMessageRow, type ChatPart, type ConversationRow, type WorkspaceFile,
} from '@/api/assistant';
import { LoadFailed } from '@/pages/errors/error-pages';

const SOURCES = ['pg-prod-02', 'mysql-crm', 'clickhouse-log'];

/**
 * 对话页（数据助手）：路由 `/assistant`（新对话）与 `/assistant/:id`。
 * 三栏：左侧会话列表 256 · 中间对话（消息区 + 底部输入框）· 右侧文件面板 288（可收起）。三栏都是白底，用 1px 边框分开。
 * 底部在 Agent 提问或请求确认时换成 AskPrompt / ApprovalPrompt，处理完再换回输入框。
 */
export function AssistantPage() {
  const { id } = useParams();
  const conversations = useConversations();
  const messages = useMessages(id);
  const [filesOpen, setFilesOpen] = React.useState(true);
  const current = conversations.data?.find((c) => c.id === id);

  if (conversations.isError) return <LoadFailed error={conversations.error} onRetry={() => conversations.refetch()} />;

  return (
    <div className="flex h-full min-h-0 bg-surface">
      <ConversationList items={conversations.data} loading={conversations.isPending} active={id} />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{id ? current?.title ?? '' : '新对话'}</span>
          <IconButton size="sm" icon={filesOpen ? <PanelRightClose /> : <PanelRight />} label={filesOpen ? '收起文件' : '文件'} onClick={() => setFilesOpen(!filesOpen)} />
        </header>
        {messages.isError
          ? <div className="flex-1"><LoadFailed error={messages.error} onRetry={() => messages.refetch()} /></div>
          : messages.isPending ? <ThreadSkeleton /> : <Conversation key={id ?? 'new'} initial={messages.data} />}
      </section>
      {filesOpen && <FilesPanel />}
    </div>
  );
}

/* ------------------------------------------------------------------ 会话列表 */

function ConversationList({ items, loading, active }: { items?: ConversationRow[]; loading: boolean; active?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const shown = (items ?? []).filter((c) => c.title.includes(q.trim()));
  const groups = ['今天', '昨天', '近 7 天', '更早'].map((g) => ({ g, rows: shown.filter((c) => c.group === g) })).filter((x) => x.rows.length);
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border pr-2 pl-4">
        <span className="text-body font-medium text-fg">对话</span>
        <IconButton size="sm" icon={<SquarePen />} label="新对话" onClick={() => navigate('/assistant')} />
      </div>
      <div className="p-2"><Input size="sm" leftIcon={<Search />} placeholder="搜索对话" value={q} onChange={(e) => setQ(e.target.value)} clearable onClear={() => setQ('')} /></div>
      <nav aria-label="对话" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="mb-1 h-8 rounded-sm" />)}
        {!loading && !items?.length && <EmptyState size="sm" title="还没有对话" />}
        {!loading && !!items?.length && !groups.length && <EmptyState size="sm" title={`没有匹配“${q}”的对话`} />}
        {groups.map(({ g, rows }) => (
          <div key={g} className="mb-2">
            <div className="flex h-7 items-center px-2 text-caption font-medium text-fg-subtle">{g}</div>
            {rows.map((c) => (
              <div key={c.id} className={cn('group/conv relative flex h-8 items-center rounded-sm',
                c.id === active ? 'bg-surface-selected' : 'hover:bg-surface-hover has-[[data-state=open]]:bg-surface-hover')}>
                <button type="button" onClick={() => navigate(`/assistant/${c.id}`)} aria-current={c.id === active ? 'page' : undefined}
                  className={cn('h-full min-w-0 flex-1 cursor-pointer truncate rounded-sm px-2 text-left text-body-sm outline-none focus-visible:shadow-focus-ring',
                    c.id === active ? 'font-medium text-primary-hover' : 'text-fg')}>
                  {c.title}
                </button>
                <span className="mr-1 shrink-0 text-micro text-fg-subtle tabular-nums group-hover/conv:hidden group-has-[[data-state=open]]/conv:hidden">{c.updated}</span>
                <div className="mr-0.5 hidden group-hover/conv:block group-has-[[data-state=open]]/conv:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><IconButton size="sm" icon={<Ellipsis />} label="更多" tooltip={false} /></DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem icon={<Pencil />} onSelect={() => toast({ tone: 'info', title: '原型：重命名对话' })}>重命名</DropdownMenuItem>
                      <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => toast({ tone: 'success', title: '已删除对话', description: c.title })}>删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

/* ------------------------------------------------------------------ 对话 */

interface Draft { id: string; name: string; size: number; status: 'uploading' | 'done'; progress: number }

function Conversation({ initial }: { initial?: ChatMessageRow[] }) {
  const chat = useChatRun(initial);
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [source, setSource] = React.useState(SOURCES[0]);
  const [model, setModel] = React.useState('pro');
  const [effort, setEffort] = React.useState('high');
  const empty = !chat.messages.length && !chat.live;

  const attach = (files: File[]) => {
    const add = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, status: 'uploading' as const, progress: 20 }));
    setDrafts((d) => [...d, ...add]);
    // 原型：假装上传 0.8 秒
    setTimeout(() => setDrafts((d) => d.map((x) => (add.some((a) => a.id === x.id) ? { ...x, status: 'done', progress: 100 } : x))), 800);
  };
  const send = (text: string) => {
    const files: ChatFile[] = drafts.filter((d) => d.status === 'done').map(({ name, size }) => ({ name, size }));
    setDrafts([]);
    void chat.send(text || '请看附件', files.length ? files : undefined);
  };

  return (
    <>
      <ChatThread>
        {empty && <ChatWelcome title="想查什么数据？" suggestions={suggestions.map((s) => ({ label: s }))} onPick={(s) => send(s.label)} />}
        {chat.messages.map((m, i) => (
          <Message key={m.id} m={m} last={i === chat.messages.length - 1 && !chat.live} />
        ))}
        {chat.live && (
          <ChatMessage role="assistant">
            <Parts parts={chat.live.parts} streaming={chat.live.streaming} />
            {chat.live.status && !chat.pending && <ChatStatus since={chat.live.status.since}>{chat.live.status.label}</ChatStatus>}
          </ChatMessage>
        )}
      </ChatThread>
      <ChatDock>
        {chat.pending?.kind === 'ask' ? (
          <AskPrompt
            questions={chat.pending.questions}
            onSkip={() => chat.answer(null)}
            onSubmit={(a) => {
              const qs = chat.pending?.kind === 'ask' ? chat.pending.questions : [];
              chat.answer({
                values: Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.values])),
                record: qs.map((q) => ({
                  question: q.question,
                  answer: [...a[q.id].values.map((v) => q.options.find((o) => o.value === v)?.label ?? v), ...(a[q.id].other ? [a[q.id].other!] : [])].join('、'),
                })),
              });
            }}
          />
        ) : chat.pending?.kind === 'approve' ? (
          <ApprovalPrompt title={chat.pending.title} tool={chat.pending.tool} detail={chat.pending.detail} danger={chat.pending.danger}
            onDeny={() => chat.decide(false)} onApprove={() => chat.decide(true)}>
            {chat.pending.facts}
          </ApprovalPrompt>
        ) : (
          <Composer
            autoFocus
            placeholder="问一个数据问题"
            busy={chat.busy}
            onStop={chat.stop}
            onSubmit={send}
            onAttach={attach}
            attachments={drafts.length ? drafts.map((d) => (
              <FileChip key={d.id} name={d.name} size={d.size} status={d.status} progress={d.progress} onRemove={() => setDrafts((x) => x.filter((y) => y.id !== d.id))} />
            )) : undefined}
            footerEnd={<ModelPicker models={models.common} moreModels={models.more} value={model} onValueChange={setModel} efforts={models.efforts} effort={effort} onEffortChange={setEffort} />}
            tools={(
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" leftIcon={<Database />} rightIcon={<ChevronDown />} className="font-mono text-caption">{source}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                  <DropdownMenuLabel>查询的数据源</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SOURCES.map((s) => <DropdownMenuItem key={s} onSelect={() => setSource(s)} className="font-mono">{s}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        )}
      </ChatDock>
    </>
  );
}

const textOf = (parts: ChatPart[]) => parts.map((p) => (p.kind === 'text' ? p.text : '')).filter(Boolean).join('\n\n');

function Message({ m, last }: { m: ChatMessageRow; last: boolean }) {
  if (m.role === 'user') {
    return (
      <ChatMessage role="user" actions={<CopyButton text={m.text ?? ''} />}
        attachments={m.files?.map((f) => <FileChip key={f.name} name={f.name} size={f.size} />)}>
        {m.text}
      </ChatMessage>
    );
  }
  return (
    <ChatMessage role="assistant" showActions={last ? 'always' : 'hover'}
      actions={<><CopyButton text={() => textOf(m.parts)} /><RetryButton onClick={() => toast({ tone: 'info', title: '原型：重新生成' })} /></>}>
      <Parts parts={m.parts} />
    </ChatMessage>
  );
}

type ToolPart = Extract<ChatPart, { kind: 'tool' }>;

/** 连续的工具调用合成一组：一个就单独一行，两个以上折叠成「运行了 2 条 SQL…」。 */
function Tools({ items }: { items: ToolPart[] }) {
  const calls = items.map((p, i) => (
    <ToolCall key={i} title={p.title} name={p.name} status={p.status} duration={p.duration} input={p.input} output={p.output} error={p.error} />
  ));
  if (items.length === 1) return calls[0];
  const running = items.find((p) => p.status === 'running');
  return <ToolGroup summary={running ? running.title : toolSummary(items.map((p) => p.name))} running={!!running}>{calls}</ToolGroup>;
}

function Parts({ parts, streaming }: { parts: ChatPart[]; streaming?: boolean }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.kind === 'tool') {
      const run: ToolPart[] = [];
      while (i < parts.length && parts[i].kind === 'tool') run.push(parts[i++] as ToolPart);
      i--;
      out.push(<Tools key={i} items={run} />);
      continue;
    }
    const lastText = streaming && i === parts.length - 1;
    switch (p.kind) {
      case 'text': out.push(<Markdown key={i} streaming={lastText}>{p.text}</Markdown>); break;
      case 'reasoning': out.push(<Reasoning key={i} seconds={p.seconds}>{p.text}</Reasoning>); break;
      case 'ask-record': out.push(<AskRecord key={i} items={p.items} skipped={!p.items.length} />); break;
      case 'approval-record': out.push(<ApprovalRecord key={i} approved={p.approved}>{p.title}</ApprovalRecord>); break;
      case 'files': out.push(<div key={i} className="flex flex-wrap gap-1.5">{p.files.map((f) => <FileChip key={f.name} name={f.name} size={f.size} onClick={() => toast({ tone: 'info', title: '原型：打开文件', description: f.name })} />)}</div>); break;
      case 'stopped': out.push(<ChatStopped key={i} />); break;
      case 'error': out.push(<ChatError key={i} onRetry={() => toast({ tone: 'info', title: '原型：重试' })}>{p.message}</ChatError>); break;
    }
  }
  return <>{out}</>;
}

function ThreadSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-(--chat-width) flex-1 flex-col gap-6 px-6 pt-6">
      <Skeleton className="ml-auto h-10 w-2/5 rounded-md" />
      <div className="flex flex-col gap-2"><Skeleton className="h-9 w-full rounded-sm" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div>
      <Skeleton className="ml-auto h-10 w-1/3 rounded-md" />
    </div>
  );
}

/* ------------------------------------------------------------------ 文件面板 */

/* 原型：文件操作改的是这一页里的本地副本，刷新后恢复；真实开发换成 src/api 里的接口。 */
const toNodes = (list: WorkspaceFile[]): FileNode[] => list.map((f) => ({ name: f.name, children: f.children ? toNodes(f.children) : undefined }));
const count = (l: WorkspaceFile[]): number => l.reduce((n, f) => n + (f.children ? count(f.children) : 1), 0);

/** 按路径改树：fn 拿到所在层的数组和下标，返回新数组。 */
function edit(list: WorkspaceFile[], path: string, fn: (siblings: WorkspaceFile[], i: number) => WorkspaceFile[]): WorkspaceFile[] {
  const [head, ...rest] = path.split('/');
  const i = list.findIndex((f) => f.name === head);
  if (i < 0) return list;
  if (!rest.length) return fn(list, i);
  return list.map((f, j) => (j === i && f.children ? { ...f, children: edit(f.children, rest.join('/'), fn) } : f));
}

function FilesPanel() {
  const files = useWorkspaceFiles();
  const [local, setLocal] = React.useState<WorkspaceFile[] | null>(null);
  React.useEffect(() => { if (files.data) setLocal(files.data); }, [files.data]);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState('输出/华东区城市GMV_1012-1018.csv');
  const add = (items: WorkspaceFile[]) => setLocal((l) => [...items, ...(l ?? [])]);
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border">
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border px-4">
        <span className="text-body font-medium text-fg">文件</span>
        {local && <span className="text-caption text-fg-subtle tabular-nums">{count(local)}</span>}
      </div>
      <div className="p-2"><Input size="sm" leftIcon={<Search />} placeholder="搜索文件" value={q} onChange={(e) => setQ(e.target.value)} clearable onClear={() => setQ('')} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5">
        {files.isPending && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mb-1 h-6 rounded-sm" />)}
        {files.isError && <EmptyState size="sm" title="文件读取失败" action={<Button size="sm" onClick={() => files.refetch()}>重试</Button>} />}
        {local && !local.length && <EmptyState size="sm" title="还没有文件" />}
        {local && (
          <FileTree data={toNodes(local)} value={sel} filter={q} defaultExpanded="all"
            onValueChange={(p) => { setSel(p); toast({ tone: 'info', title: '原型：预览文件', description: p }); }}
            onRename={(p, name) => { setLocal((l) => edit(l ?? [], p, (s, i) => s.map((f, j) => (j === i ? { ...f, name } : f)))); toast({ tone: 'success', title: '已重命名', description: name }); }}
            onDelete={(p) => { setLocal((l) => edit(l ?? [], p, (s, i) => s.filter((_, j) => j !== i))); toast({ tone: 'success', title: '已删除', description: p }); }}
            onDownload={(p) => toast({ tone: 'info', title: '原型：开始下载', description: p })}
            onCreate={(_, name, kind) => { add([kind === 'folder' ? { name, children: [] } : { name }]); toast({ tone: 'success', title: kind === 'folder' ? '已新建文件夹' : '已新建文件', description: name }); }}
            onUpload={(_, fs) => { add(fs.map((f) => ({ name: f.name }))); toast({ tone: 'success', title: `已上传 ${fs.length} 个文件` }); }}
          />
        )}
      </div>
    </aside>
  );
}
