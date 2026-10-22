import * as React from 'react';
import { Database, FileText } from 'lucide-react';
import {
  ApprovalPrompt, ApprovalRecord, AskPrompt, AskRecord, ChatDock, ChatError, ChatMessage, ChatStatus, ChatThread, Composer, CopyButton,
  FileChip, FileTree, Markdown, ModelPicker, Reasoning, RetryButton, ToolCall, toast, type FileNode,
} from '@/components/ui';

const FILES: FileNode[] = [
  { name: 'src', children: [
    { name: 'app', children: [{ name: 'routes.tsx' }, { name: 'nav.tsx' }] },
    { name: 'pages', children: [{ name: 'order-list-page.tsx' }, { name: 'legacy-page.tsx' }] },
    { name: 'main.tsx' },
  ] },
  { name: 'docs', children: [{ name: 'PRD.md' }, { name: '架构图.png' }] },
  { name: 'package.json' },
  { name: '.env.example' },
];

const ANSWER = `上周华东区 GMV 为 **¥1,284.6 万**，环比 **+8.2%**。

| 区域 | GMV（万元） | 环比 |
|---|---|---|
| 华东 | 1,284.6 | +8.2% |
| 华南 | 932.1 | +3.1% |

- 会员日单日 GMV ¥286.3 万；
- 上海、杭州客单价分别上涨 6.4% 和 5.1%。`;

export function ChatDemo() {
  const [streamed, setStreamed] = React.useState(ANSWER.slice(0, 40));
  const [model, setModel] = React.useState('pro');
  const [effort, setEffort] = React.useState('high');
  React.useEffect(() => {
    let i = 40;
    const t = setInterval(() => { i = i >= ANSWER.length ? 40 : i + 3; setStreamed(ANSWER.slice(0, i)); }, 60);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
        <div className="flex h-[640px] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card">
          <ChatThread>
            <ChatMessage role="user" actions={<CopyButton text="上周华东区的 GMV 是多少？" />}>上周华东区的 GMV 是多少？</ChatMessage>
            <ChatMessage role="assistant" showActions="always" actions={<><CopyButton text={ANSWER} /><RetryButton /></>}>
              <Reasoning seconds={4}>「上周」按自然周取 10 月 12 日到 18 日，GMV 用实付金额汇总。</Reasoning>
              <ToolCall title="查询订单数据" name="run_sql" duration="1.4 秒" input={'SELECT region, SUM(pay_amount) …'} output={'[ … 3 行 ]'} />
              <ToolCall title="按城市汇总" name="run_sql" status="error" duration="0.8 秒" error={'column "city" does not exist'} />
              <ToolCall title="读取数据字典" name="read_doc" status="running" />
              <Markdown streaming>{streamed}</Markdown>
            </ChatMessage>
            <ChatMessage role="user" attachments={<FileChip name="城市区域对照表.xlsx" size={48_312} />}>按城市拆一下</ChatMessage>
            <ChatMessage role="assistant">
              <AskRecord items={[{ question: '导出成哪种格式？', answer: 'Excel' }, { question: '需要哪些字段？', answer: 'GMV、客单价' }]} />
              <ApprovalRecord approved>删除 3 个查询</ApprovalRecord>
              <ChatError onRetry={() => toast({ tone: 'info', title: '重试' })}>生成中断：模型服务超时</ChatError>
              <ChatStatus since={Date.now() - 3000}>正在查询 orders_daily</ChatStatus>
            </ChatMessage>
          </ChatThread>
          <ChatDock>
            <Composer onSubmit={(t) => toast({ tone: 'info', title: '发送', description: t })} onAttach={() => {}}
              attachments={<><FileChip name="门店月报.csv" size={182_400} onRemove={() => {}} /><FileChip name="区域趋势.png" status="uploading" progress={64} onRemove={() => {}} /><FileChip name="超大文件.zip" status="error" error="超过 20 MB" onRemove={() => {}} /></>}
              tools={<span className="inline-flex items-center gap-1 px-1 font-mono text-caption text-fg-muted"><Database className="size-3.5" />pg-prod-02</span>}
              footerEnd={<ModelPicker value={model} onValueChange={setModel} effort={effort} onEffortChange={setEffort} models={[{ value: 'pro', label: 'Pro', description: '复杂分析和日常问数' }, { value: 'lite', label: 'Lite', description: '回答更快，额度消耗更少' }]} moreModels={[{ value: 'pro-long', label: 'Pro 长上下文' }]} efforts={[{ value: 'low', label: '低' }, { value: 'medium', label: '中' }, { value: 'high', label: '高' }]} />} />
          </ChatDock>
        </div>
        <div className="flex h-[640px] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card">
          <div className="flex h-11 items-center gap-1.5 border-b border-border px-3 text-body-sm font-medium text-fg"><FileText className="size-4 text-fg-subtle" />文件</div>
          <div className="min-h-0 flex-1 overflow-auto p-1.5"><FileTree data={FILES} defaultValue="src/pages/order-list-page.tsx" defaultExpanded="all" onRename={(p, n) => toast({ tone: 'success', title: '已重命名', description: `${p} → ${n}` })} onDelete={(p) => toast({ tone: 'success', title: '已删除', description: p })} onDownload={(p) => toast({ tone: 'info', title: '下载', description: p })} onCreate={(_, n, k) => toast({ tone: 'success', title: k === 'folder' ? '已新建文件夹' : '已新建文件', description: n })} onUpload={(_, fs) => toast({ tone: 'success', title: `已上传 ${fs.length} 个文件` })} /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 items-start gap-4">
        <AskPrompt onSkip={() => {}} onSubmit={(a) => toast({ tone: 'success', title: '已提交', description: JSON.stringify(a) })} questions={[
          { id: 'format', header: '格式', question: '导出成哪种格式？', options: [{ value: 'csv', label: 'CSV', description: '原始数据，适合再加工' }, { value: 'xlsx', label: 'Excel' }, { value: 'pdf', label: 'PDF 报告' }] },
          { id: 'cols', header: '字段', question: '需要哪些字段？', multiple: true, options: [{ value: 'gmv', label: 'GMV' }, { value: 'aov', label: '客单价' }] },
        ]} />
        <ApprovalPrompt danger title="允许删除 3 个查询？" tool="delete_queries" detail={'{ "ids": ["q_1029", "q_1033", "q_1041"] }'}
          onDeny={() => toast({ tone: 'info', title: '已拒绝' })} onApprove={() => toast({ tone: 'success', title: '已允许' })}>删除后运行记录一起删除，无法恢复。</ApprovalPrompt>
      </div>
    </div>
  );
}
