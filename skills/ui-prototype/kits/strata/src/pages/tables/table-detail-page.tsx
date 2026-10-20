import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Copy, Ellipsis, GitBranch, Pencil, Play, RefreshCw, Star, Trash2 } from 'lucide-react';
import {
  Alert, Avatar, Badge, BarChart, Button, ButtonGroup, Card, DataTable, DescriptionList, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, EmptyState, Field, IconButton,
  Input, List, ListItem, PageBody, PageHeader, SegmentedControl, Select, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, toast,
} from '@/components/ui';
import { useTable, useTablePreview } from '@/api/tables';
import { LoadFailed, NotFoundPage } from '@/pages/errors/error-pages';

/** 详情页：页头（名称、状态、操作、子模块 Tabs）、带边框与简洁两种描述列表、字段表、编辑弹窗。路由 `/data/tables/:name`。 */
export function TableDetailPage() {
  const { name = '' } = useParams();
  const navigate = useNavigate();
  const { data: t, isPending, isError, error, refetch } = useTable(name);
  const [tab, setTab] = React.useState('overview');
  const preview = useTablePreview(name, tab === 'preview');
  const [editing, setEditing] = React.useState(false);
  const [starred, setStarred] = React.useState(false);
  const [notice, setNotice] = React.useState(true);
  const [view, setView] = React.useState('table');

  // 四种状态：加载中 → 同尺寸骨架；出错、无权限 → LoadFailed；找不到 → 404（原型里用 ?state= 切换）
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  if (isPending) return <DetailSkeleton />;
  if (!t) return <NotFoundPage />;
  const FIELDS = t.fields;

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <PageHeader
          title={t.name}
          meta={<><Badge tone={t.status === '已上线' ? 'success' : 'neutral'}>{t.status}</Badge><Badge icon={false}>{t.kind}</Badge></>}
          actions={<>
            <IconButton variant="outline" icon={<Star className={starred ? 'fill-current text-warning' : undefined} />} label={starred ? '取消收藏' : '收藏'} onClick={() => setStarred(!starred)} />
            <ButtonGroup>
              <Button leftIcon={<RefreshCw />} onClick={() => toast({ tone: 'loading', title: '正在刷新', description: `${t.name} · 预计 40 秒`, duration: 2500 })}>刷新</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" leftIcon={<Ellipsis />} aria-label="更多" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem icon={<Pencil />} onSelect={() => setEditing(true)}>编辑信息</DropdownMenuItem>
                  <DropdownMenuItem icon={<Copy />}>复制表名</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem icon={<Trash2 />} danger>删除数据表</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
            <Button variant="default" leftIcon={<Play />} onClick={() => navigate('/queries')}>运行查询</Button>
          </>}
          tabs={<TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="schema" count={FIELDS.length}>字段</TabsTrigger>
            <TabsTrigger value="preview">数据预览</TabsTrigger>
            <TabsTrigger value="lineage">血缘</TabsTrigger>
            <TabsTrigger value="history" count={t.history.length}>变更记录</TabsTrigger>
          </TabsList>}
        />

        <TabsContent value="overview">
          <PageBody>
            {notice && <Alert tone="warning" title="1 个字段即将下线" action={<Button size="sm">查看</Button>} onClose={() => setNotice(false)}>字段 user_level 将于 11 月 1 日下线，3 个查询仍在使用。</Alert>}
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-4">
              <div className="flex flex-col gap-4">
              <Card title="基本信息" extra={<Button size="sm" leftIcon={<Pencil />} onClick={() => setEditing(true)}>编辑</Button>}>
                <DescriptionList bordered columns={2} items={[
                  { label: '名称', value: t.name, mono: true }, { label: '类型', value: t.kind },
                  { label: '状态', value: <Badge tone="success">{t.status}</Badge> }, { label: '所属项目', value: t.project },
                  { label: '负责人', value: t.owner }, { label: '刷新频率', value: t.schedule },
                  { label: '行数', value: t.rows.toLocaleString('zh-CN') }, { label: '存储', value: t.size },
                  { label: '创建时间', value: t.createdAt }, { label: '最近更新', value: t.updatedAt },
                  { label: '描述', value: t.description, span: 2 },
                ]} />
              </Card>
              <Card title="近 30 天新增行数">
                <BarChart data={t.daily} height={180} labelEvery={5} />
              </Card>
              </div>
              <div className="flex flex-col gap-4">
                <Card title="来源">
                  <DescriptionList columns={1} labelWidth={72} items={[
                    { label: '数据源', value: t.source.name, mono: true }, { label: '数据库', value: t.source.database, mono: true },
                    { label: 'Schema', value: t.source.schema, mono: true }, { label: '只读连接', value: t.source.readonly ? '是' : '否' },
                  ]} />
                </Card>
                <Card title="使用中的查询" padding="none" extra={<Badge icon={false}>{t.usedBy.length}</Badge>}>
                  <List>
                    {t.usedBy.map((q) => <ListItem key={q.id} icon={<GitBranch />} title={q.name} meta={`${q.owner} · ${q.schedule}`} trailing={<Badge tone={q.tone}>{q.status}</Badge>} />)}
                  </List>
                </Card>
                <Card title="最近刷新" padding="none">
                  <List>
                    {[['10-19 02:14', '1 分 42 秒', 'success', '成功'], ['10-18 02:13', '1 分 38 秒', 'success', '成功'], ['10-17 02:20', '超时重试 1 次', 'warning', '重试']].map(([t, d, tone, label]) => (
                      <ListItem key={t} icon={<RefreshCw />} title={<span className="tabular-nums">{t}</span>} meta={d} trailing={<Badge tone={tone as 'success' | 'warning'}>{label}</Badge>} />
                    ))}
                  </List>
                </Card>
              </div>
            </div>
          </PageBody>
        </TabsContent>

        <TabsContent value="schema">
          <PageBody>
            <DataTable rowKey={(r) => r.name} data={FIELDS} pagination={false}
              toolbar={<><div className="w-60"><Input placeholder="搜索字段" /></div><span className="flex-1" /><Button leftIcon={<Pencil />}>编辑字段说明</Button></>}
              columns={[
                { key: 'name', title: '字段名', width: 180, render: (r) => <span className="font-mono text-code font-medium">{r.name}</span> },
                { key: 'type', title: '类型', width: 140, render: (r) => <Badge icon={false} className="font-mono">{r.type}</Badge> },
                { key: 'desc', title: '说明', width: 320, minWidth: 200, render: (r) => r.name === 'user_level' ? <span className="inline-flex items-center gap-2">{r.desc}<Badge tone="warning">即将下线</Badge></span> : r.desc },
                { key: 'nullable', title: '可空', width: 72, render: (r) => (r.nullable ? '是' : <span className="text-fg-subtle">否</span>) },
                { key: 'sample', title: '示例值', width: 180, render: (r) => <span className="font-mono text-code text-fg-muted">{r.sample}</span> },
              ]} />
          </PageBody>
        </TabsContent>

        <TabsContent value="preview">
          <PageBody>
            <DataTable rowKey={(r) => r.id} density="compact" pageSize={10} loading={preview.isPending}
              toolbar={<><SegmentedControl size="sm" value={view} onValueChange={setView} options={[{ value: 'table', label: '表格' }, { value: 'json', label: 'JSON' }]} /><span className="flex-1" /><span className="text-caption text-fg-subtle">最近 100 行</span></>}
              data={preview.data ?? []}
              columns={[
                { key: 'id', title: 'order_id', width: 140, render: (r) => <span className="font-mono text-code">{r.id}</span> },
                { key: 'at', title: 'created_at', width: 160, render: (r) => <span className="tabular-nums text-fg-muted">{r.at}</span> },
                { key: 'region', title: 'region' }, { key: 'city', title: 'city' }, { key: 'channel', title: 'channel' },
                { key: 'amount', title: 'pay_amount', width: 120, numeric: true, sortable: true, render: (r) => r.amount.toFixed(2) },
              ]} />
          </PageBody>
        </TabsContent>

        <TabsContent value="lineage">
          <PageBody><Card><EmptyState icon={<GitBranch />} title="血缘图正在生成" action={<Button leftIcon={<RefreshCw />}>刷新</Button>} /></Card></PageBody>
        </TabsContent>

        <TabsContent value="history">
          <PageBody>
            <Card title="变更记录" padding="none">
              <List>
                {t.history.map(({ who, what, when }) => (
                  <ListItem key={when} avatar={<Avatar name={who} />} title={<span className="font-normal text-fg-muted"><b className="font-semibold text-fg">{who}</b> {what}</span>} trailing={when} />
                ))}
              </List>
            </Card>
          </PageBody>
        </TabsContent>
      </Tabs>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑基本信息</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="负责人" required><Select defaultValue="张一鸣" options={['张一鸣', '李想', '王晓', '陈静'].map((n) => ({ value: n, label: n }))} /></Field>
                <Field label="刷新频率" required><Select defaultValue="d" options={[{ value: 'h', label: '每小时' }, { value: 'd', label: '每天 02:00' }, { value: 'w', label: '每周一 08:00' }]} /></Field>
              </div>
              <Field label="描述" aside="31 / 200"><Textarea rows={3} maxLength={200} showCount defaultValue={t.description} /></Field>
              <Field label="表名"><Input defaultValue={t.name} readOnly /></Field>
              <Switch label="变更后通知使用者" defaultChecked />
            </div>
          </DialogBody>
          <DialogFooter><Button onClick={() => setEditing(false)}>取消</Button><Button variant="default" onClick={() => { setEditing(false); toast({ tone: 'success', title: '已保存', description: `${t.name} 基本信息已更新。` }); }}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <PageHeader title={<Skeleton className="h-7 w-48" />} />
      <PageBody>
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4"><Skeleton className="h-72 rounded-md" /><Skeleton className="h-72 rounded-md" /></div>
      </PageBody>
    </>
  );
}
