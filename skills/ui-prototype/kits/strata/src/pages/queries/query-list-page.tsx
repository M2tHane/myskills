import * as React from 'react';
import { useNavigate } from 'react-router';
import { Copy, Download, Ellipsis, ListFilter, Pencil, Play, Plus, Search, Trash2 } from 'lucide-react';
import {
  Badge, Button, Checkbox, DataTable, DateRangePicker, type DateRange, DescriptionList, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, EmptyState, Field, IconButton, Input,
  PageBody, PageHeader, Popover, PopoverClose, PopoverContent, PopoverTrigger, Select, Sheet, SheetContent, Tabs, TabsContent, TabsList,
  TabsTrigger, Textarea, toast, type Column,
} from '@/components/ui';
import {
  owners, useDeleteQueries, useDuplicateQuery, useQueryList, useRestoreQueries, type QueryRow,
} from '@/api/queries';
import { useCurrentUser } from '@/api/session';
import { LoadFailed } from '@/pages/errors/error-pages';

const STATUS_OPTIONS = [{ value: '运行中', label: '运行中' }, { value: '已完成', label: '已完成' }, { value: '待审核', label: '待审核' }, { value: '失败', label: '失败' }, { value: '草稿', label: '草稿' }];

/** 「2026-10-19 08:56」是否落在所选日期范围内（按天，含两端）。 */
const inRange = (at: string, r?: DateRange) => {
  if (!r) return true;
  const d = at.slice(0, 10);
  const f = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return d >= f(r.from) && d <= f(r.to);
};

/** 列表页：页头 + Tabs、筛选、可排序可多选的表格、行详情侧滑、新建 / 删除弹窗、toast。路由 `/queries`。 */
export function QueryListPage() {
  const navigate = useNavigate();
  const { data: rows = [], isPending, isError, error, refetch } = useQueryList();
  const me = useCurrentUser().name;
  const del = useDeleteQueries();
  const restore = useRestoreQueries();
  const duplicate = useDuplicateQuery();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<string>();
  const [owner, setOwner] = React.useState<string>();
  const [range, setRange] = React.useState<DateRange>();
  const [onlyMine, setOnlyMine] = React.useState(false);
  const [tab, setTab] = React.useState('all');
  const [open, setOpen] = React.useState<QueryRow | null>(null);
  const [deleting, setDeleting] = React.useState<QueryRow | null>(null);

  const shown = rows.filter((r) =>
    (!q || r.name.includes(q)) && inRange(r.updated, range) && (!status || r.status === status) && (!owner || r.owner === owner) &&
    (!onlyMine || r.owner === me) && (tab !== 'mine' || r.owner === me) && (tab !== 'sched' || r.schedule !== '手动'));
  const filters = (status ? 1 : 0) + (owner ? 1 : 0) + (onlyMine ? 1 : 0);
  const clear = () => { setQ(''); setStatus(undefined); setOwner(undefined); setOnlyMine(false); setRange(undefined); };
  // 空状态分两种：一条数据都没有（或当前 Tab 下没有）→ 引导新建；有数据但筛选后没有结果 → 引导清除筛选
  const filtered = rows.length > 0 && (!!q || !!range || filters > 0);
  const empty = filtered
    ? <EmptyState size="sm" icon={<Search />} title={q ? `没有匹配“${q}”的查询` : '没有符合条件的查询'} action={<Button size="sm" onClick={clear}>清除筛选</Button>} />
    : <EmptyState size="sm" icon={<ListFilter />} title={rows.length ? '这里还没有查询' : '还没有查询'} action={<Button size="sm" leftIcon={<Plus />} onClick={() => navigate('/queries/new')}>新建查询</Button>} />;

  const remove = async (items: QueryRow[]) => {
    setDeleting(null); setOpen(null);
    const removed = await del.mutateAsync(items.map((r) => r.id));
    toast({
      tone: 'info', title: removed.length === 1 ? `已删除「${removed[0].name}」` : `已删除 ${removed.length} 个查询`, description: '30 秒内可撤销。',
      action: { label: '撤销', onClick: () => restore.mutate(removed) },
    });
  };
  const exportRows = (n: number) => {
    const id = toast({ tone: 'loading', title: '正在导出', description: `${n} 个查询`, duration: 1200 });
    window.setTimeout(() => toast({ tone: 'success', title: '导出完成', description: `queries_${id}.csv 已开始下载。` }), 1300);
  };

  const columns: Column<QueryRow>[] = [
    { key: 'name', title: '名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'status', title: '状态', width: 108, render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
    { key: 'source', title: '数据源', width: 148, render: (r) => <span className="font-mono text-code text-fg-muted">{r.source}</span> },
    { key: 'owner', title: '负责人', width: 96 },
    { key: 'rows', title: '行数', width: 104, numeric: true, sortable: true, render: (r) => r.rows.toLocaleString('zh-CN') },
    { key: 'ms', title: '耗时', width: 84, numeric: true, sortable: true, render: (r) => `${r.ms.toFixed(1)} s` },
    { key: 'updated', title: '更新时间', width: 148, sortable: true, render: (r) => <span className="text-fg-subtle tabular-nums">{r.updated}</span> },
  ];

  const toolbar = (
    <>
      <div className="w-60"><Input leftIcon={<Search />} placeholder="搜索查询名称" value={q} onChange={(e) => setQ(e.target.value)} clearable onClear={() => setQ('')} /></div>
      <div className="w-32"><Select placeholder="全部状态" options={STATUS_OPTIONS} value={status} onValueChange={setStatus} /></div>
      <div className="w-40"><DateRangePicker value={range} onValueChange={setRange} placeholder="更新时间" aria-label="更新时间" /></div>
      <Popover>
        <PopoverTrigger asChild>
          <Button leftIcon={<ListFilter />}>筛选{filters > 0 && <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-soft px-[5px] text-micro font-semibold text-primary-hover">{filters}</span>}</Button>
        </PopoverTrigger>
        <PopoverContent title="筛选" width={300}
          footer={<><PopoverClose asChild><Button size="sm" variant="ghost" onClick={clear}>重置</Button></PopoverClose><PopoverClose asChild><Button size="sm" variant="default">应用</Button></PopoverClose></>}>
          <div className="flex flex-col gap-3">
            <Field label="负责人"><Select placeholder="全部" options={owners.map((o) => ({ value: o, label: o }))} value={owner} onValueChange={setOwner} searchPlaceholder="搜索成员" /></Field>
            <Checkbox label="只看我创建的" checked={onlyMine} onCheckedChange={setOnlyMine} />
          </div>
        </PopoverContent>
      </Popover>
      <span className="flex-1" />
      <Button leftIcon={<Download />} onClick={() => exportRows(shown.length)}>导出</Button>
    </>
  );

  // 四种状态：加载中 → DataTable loading；空数据 → DataTable empty（上面的两种空状态）；出错、无权限 → LoadFailed（原型里用 ?state= 切换）
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <PageHeader title="查询"
          actions={<Button variant="default" leftIcon={<Plus />} onClick={() => navigate('/queries/new')}>新建查询</Button>}
          tabs={<TabsList>
            <TabsTrigger value="all" count={rows.length}>全部</TabsTrigger>
            <TabsTrigger value="mine" count={rows.filter((r) => r.owner === me).length}>我创建的</TabsTrigger>
            <TabsTrigger value="sched">定时任务</TabsTrigger>
          </TabsList>} />
        <TabsContent value={tab} forceMount>
          <PageBody>
            <DataTable key={tab} columns={columns} data={shown} rowKey={(r) => r.id} selectable loading={isPending} defaultSort={{ key: 'updated', dir: 'desc' }}
              toolbar={toolbar} onRowClick={setOpen} activeRowKey={open?.id}
              bulkActions={(k, done) => <>
                <Button size="sm" leftIcon={<Download />} onClick={() => { exportRows(k.length); done(); }}>导出</Button>
                <Button size="sm" variant="destructive-outline" leftIcon={<Trash2 />} onClick={() => { done(); remove(rows.filter((r) => k.includes(r.id))); }}>删除</Button>
              </>}
              rowActions={(r) => <>
                <IconButton size="sm" icon={<Play />} label="运行" onClick={() => toast({ tone: 'success', title: '已开始运行', description: r.name })} />
                <IconButton size="sm" icon={<Pencil />} label="编辑" onClick={() => navigate(`/queries/${r.id}/edit`)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><IconButton size="sm" icon={<Ellipsis />} label="更多" tooltip={false} /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem icon={<Copy />} shortcut="⌘D" onSelect={() => duplicate.mutate(r.id, { onSuccess: (c) => toast({ tone: 'success', title: '已复制', description: c.name }) })}>复制</DropdownMenuItem>
                    <DropdownMenuItem icon={<Download />} onSelect={() => exportRows(1)}>导出 CSV</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => setDeleting(r)}>删除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>}
              empty={empty}
            />
          </PageBody>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <SheetContent title={open.name} meta={<Badge tone={open.tone}>{open.status}</Badge>}
            footer={<><Button variant="destructive-outline" leftIcon={<Trash2 />} onClick={() => setDeleting(open)}>删除</Button><span className="flex-1" /><Button onClick={() => setOpen(null)}>关闭</Button><Button variant="default" leftIcon={<Play />} onClick={() => toast({ tone: 'success', title: '已开始运行', description: open.name })}>运行</Button></>}>
            <Tabs defaultValue="info">
              <TabsList size="sm"><TabsTrigger value="info">基本信息</TabsTrigger><TabsTrigger value="sql">SQL</TabsTrigger><TabsTrigger value="runs" count={6}>运行记录</TabsTrigger></TabsList>
              <TabsContent value="info" className="pt-4">
                <DescriptionList bordered columns={1} items={[
                  { label: '负责人', value: open.owner }, { label: '数据源', value: open.source, mono: true }, { label: '刷新频率', value: open.schedule },
                  { label: '行数', value: open.rows.toLocaleString('zh-CN') }, { label: '平均耗时', value: `${open.ms.toFixed(1)} s` }, { label: '更新时间', value: open.updated },
                ]} />
              </TabsContent>
              <TabsContent value="sql" className="pt-4"><Textarea mono rows={8} defaultValue={`SELECT region, SUM(pay_amount) AS gmv\nFROM orders_daily\nWHERE created_at >= CURRENT_DATE - INTERVAL '90 day'\nGROUP BY region\nORDER BY gmv DESC;`} /></TabsContent>
              <TabsContent value="runs" className="pt-4"><EmptyState size="sm" title="暂无运行记录" /></TabsContent>
            </Tabs>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent size="sm">
          <DialogHeader tone="danger"><DialogTitle>删除这个查询？</DialogTitle></DialogHeader>
          <DialogBody indent>「{deleting?.name}」及其运行记录将被永久删除。</DialogBody>
          <DialogFooter><Button onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" loading={del.isPending} onClick={() => deleting && remove([deleting])}>删除</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
