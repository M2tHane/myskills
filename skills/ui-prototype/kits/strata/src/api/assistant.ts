/**
 * 数据助手：会话列表、历史消息、工作区文件，以及发送消息后的模拟运行（useChatRun）。
 *
 * 真实开发时：会话和消息换成接口；useChatRun 换成流式接口（SSE / WebSocket），
 * 把服务端事件（思考、工具开始 / 结束、文字片段、提问、确认）按同样的 ChatPart 结构追加，页面不用改。
 */
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import {
  CONVERSATIONS, MESSAGES, SUGGESTIONS, WORKSPACE, scriptFor,
  type AskQuestionData, type ChatFile, type ChatMessageRow, type ChatPart, type ConversationRow, type Step, type WorkspaceFile,
} from '@/mocks/assistant';

export type { AskQuestionData, ChatFile, ChatMessageRow, ChatPart, ConversationRow, WorkspaceFile };
export const suggestions = SUGGESTIONS;

export const assistantKeys = {
  conversations: ['assistant', 'conversations'] as const,
  messages: (id: string) => ['assistant', 'messages', id] as const,
  files: ['assistant', 'files'] as const,
};

export const useConversations = () => useQuery({ queryKey: assistantKeys.conversations, queryFn: () => delay(CONVERSATIONS) });
export const useMessages = (id?: string) => useQuery({
  queryKey: assistantKeys.messages(id ?? 'new'),
  queryFn: () => delay(id ? MESSAGES[id] ?? [] : []),
});
export const useWorkspaceFiles = () => useQuery({ queryKey: assistantKeys.files, queryFn: () => delay(WORKSPACE) });

/* ------------------------------------------------------------------ 模拟运行 */

export type Pending =
  | { kind: 'ask'; questions: AskQuestionData[] }
  | { kind: 'approve'; title: string; tool: string; detail: string; danger?: boolean; facts?: string };

export interface LiveMessage { parts: ChatPart[]; status?: { label: string; since: number }; streaming: boolean }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

/**
 * 一个会话里的消息与运行状态。send() 之后按剧本逐步追加：思考 → 工具调用 → 流式文字；
 * 剧本里有提问或确认时停下，pending 不为空，页面在底部显示 AskPrompt / ApprovalPrompt，answer() / decide() 之后继续。
 */
export function useChatRun(initial: ChatMessageRow[] | undefined) {
  const [messages, setMessages] = React.useState<ChatMessageRow[]>(initial ?? []);
  const [live, setLive] = React.useState<LiveMessage | null>(null);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const run = React.useRef(0);
  const parts = React.useRef<ChatPart[]>([]);
  const waiter = React.useRef<((v: unknown) => void) | null>(null);

  React.useEffect(() => { run.current++; setMessages(initial ?? []); setLive(null); setPending(null); }, [initial]);
  React.useEffect(() => () => { run.current++; }, []);

  const push = (p: ChatPart) => { parts.current = [...parts.current, p]; };
  const patchLast = (p: ChatPart) => { parts.current = [...parts.current.slice(0, -1), p]; };
  const show = (extra?: Partial<LiveMessage>) => setLive({ parts: parts.current, streaming: false, ...extra });
  const finish = (extra: ChatPart[] = []) => {
    const all = [...parts.current, ...extra];
    if (all.length) setMessages((m) => [...m, { id: 'a' + ++seq, role: 'assistant', parts: all }]);
    parts.current = [];
    setLive(null);
    setPending(null);
  };

  const play = async (steps: Step[], token: number): Promise<void> => {
    const alive = () => run.current === token;
    for (const s of steps) {
      if (!alive()) return;
      if (s.do === 'think') {
        const since = Date.now();
        show({ status: { label: '正在思考', since } });
        await sleep(s.ms);
        if (!alive()) return;
        push({ kind: 'reasoning', text: s.text, seconds: Math.max(1, Math.round((Date.now() - since) / 1000)) });
        show();
      } else if (s.do === 'tool') {
        const t0 = Date.now();
        push({ kind: 'tool', title: s.title, name: s.name, status: 'running', input: s.input });
        show();
        await sleep(s.ms);
        if (!alive()) return;
        patchLast({ kind: 'tool', title: s.title, name: s.name, status: s.error ? 'error' : 'done', input: s.input, output: s.output, error: s.error, duration: `${((Date.now() - t0) / 1000).toFixed(1)} 秒` });
        show();
      } else if (s.do === 'text') {
        push({ kind: 'text', text: '' });
        for (let i = 0; i < s.text.length; i += 3) {
          if (!alive()) return;
          patchLast({ kind: 'text', text: s.text.slice(0, i + 3) });
          show({ streaming: true });
          await sleep(22);
        }
        show();
      } else if (s.do === 'files') {
        push({ kind: 'files', files: s.files });
        show();
      } else if (s.do === 'ask') {
        show();
        setPending({ kind: 'ask', questions: s.questions });
        const answers = (await new Promise<unknown>((r) => { waiter.current = r; })) as { record: Array<{ question: string; answer: string }>; values: Record<string, string[]> } | null;
        if (!alive()) return;
        setPending(null);
        if (!answers) { push({ kind: 'ask-record', items: [] }); show(); push({ kind: 'text', text: '好的，先不导出。' }); continue; }
        push({ kind: 'ask-record', items: answers.record });
        show();
        await play(s.then(answers.values), token);
      } else if (s.do === 'approve') {
        show();
        setPending({ kind: 'approve', title: s.title, tool: s.tool, detail: s.detail, danger: s.danger, facts: s.facts });
        const ok = (await new Promise<unknown>((r) => { waiter.current = r; })) as boolean;
        if (!alive()) return;
        setPending(null);
        push({ kind: 'approval-record', approved: ok, title: s.title.replace(/[？?]$/, '').replace(/^允许/, '') });
        show();
        await play(ok ? s.approved : s.denied, token);
      }
    }
  };

  const send = async (text: string, files?: ChatFile[]) => {
    const token = ++run.current;
    parts.current = [];
    setMessages((m) => [...m, { id: 'u' + ++seq, role: 'user', text, files, parts: [] }]);
    show({ status: { label: '正在思考', since: Date.now() } });
    await sleep(400);
    await play(scriptFor(text), token);
    if (run.current === token) finish();
  };

  /** 停止：保留已经生成的部分，末尾加一行「已停止生成」。 */
  const stop = () => {
    run.current++;
    waiter.current = null;
    const done = parts.current.map((p) => (p.kind === 'tool' && p.status === 'running' ? { ...p, status: 'error' as const, error: '已停止' } : p));
    parts.current = done;
    finish([{ kind: 'stopped' }]);
  };

  /** 回答提问；传 null 表示跳过。 */
  const answer = (a: { record: Array<{ question: string; answer: string }>; values: Record<string, string[]> } | null) => { waiter.current?.(a); waiter.current = null; };
  const decide = (approved: boolean) => { waiter.current?.(approved); waiter.current = null; };

  return { messages, live, pending, busy: live != null, send, stop, answer, decide };
}
