import * as React from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { Badge, Button, DataTable, EmptyState, Input, PageBody, PageHeader, Select, type BadgeTone, type Column, type DataTableSort } from '@/components/ui';
import { __camel__Statuses, use__Name__List, type __Name__Row, type __Name__Status } from '@/api/__kebab__';
import { LoadFailed } from '@/pages/errors/error-pages';

const TONE: Record<__Name__Status, BadgeTone> = { 启用: 'success', 待审核: 'warning', 停用: 'neutral' };

/**
 * __title__：路由 `__route__`。由 scripts/new-page.mjs 生成，标了 TODO(prd) 的地方照 PRD 页面规格填。
 * 服务端分页：页码、关键字、筛选、排序都随请求发给接口，接口返回当前页和总数。
 */
export function __Name__ListPage() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<__Name__Status>();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sort, setSort] = React.useState<DataTableSort | undefined>({ key: 'updated', dir: 'desc' });
  const { data, isPending, isError, error, refetch } = use__Name__List({ page, pageSize, q, filters: { status }, sort });
  const filtered = !!q || !!status;
  const clear = () => { setQ(''); setStatus(undefined); setPage(1); };
  // TODO(prd) 主操作
  const create = () => navigate('__base__/new');

  // TODO(prd) 列照页面规格：名称列不写 width，数字列 numeric，能排序的写 sortable
  const columns: Column<__Name__Row>[] = [
    { key: 'code', title: '编号', width: 120, render: (r) => <span className="font-mono text-code text-fg-muted">{r.code}</span> },
    { key: 'name', title: '名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'status', title: '状态', width: 108, render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
    { key: 'owner', title: '负责人', width: 96 },
    { key: 'updated', title: '更新时间', width: 148, sortable: true, render: (r) => <span className="text-fg-subtle tabular-nums">{r.updated}</span> },
  ];

  // TODO(prd) 筛选项照页面规格
  const toolbar = (
    <>
      <div className="w-60"><Input leftIcon={<Search />} placeholder="搜索编号、名称" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} clearable onClear={() => { setQ(''); setPage(1); }} /></div>
      <div className="w-32"><Select placeholder="全部状态" options={__camel__Statuses.map((s) => ({ value: s, label: s }))} value={status} onValueChange={(v) => { setStatus(v as __Name__Status); setPage(1); }} /></div>
    </>
  );

  // 空状态两种：一条都没有 → 引导新建（?state=empty 看的是这种）；筛选后没有结果 → 引导清除筛选
  const empty = filtered
    ? <EmptyState size="sm" icon={<Search />} title={q ? `没有匹配“${q}”的__noun__` : '没有符合条件的__noun__'} action={<Button size="sm" onClick={clear}>清除筛选</Button>} />
    : <EmptyState size="sm" title="还没有__noun__" action={<Button size="sm" leftIcon={<Plus />} onClick={create}>新建__noun__</Button>} />;

  // 四种状态：加载中 → DataTable loading；空 → 上面的 empty；出错、无权限 → LoadFailed（原型里用 ?state= 切换）
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  return (
    <>
      <PageHeader title="__title__" actions={<Button variant="default" leftIcon={<Plus />} onClick={create}>新建__noun__</Button>} />
      <PageBody>
        <DataTable columns={columns} data={data?.items ?? []} rowKey={(r) => r.id} loading={isPending} toolbar={toolbar} empty={empty}
          total={data?.total ?? 0} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          sort={sort} onSortChange={(s) => { setSort(s); setPage(1); }}
          onRowClick={(r) => navigate(`__base__/${r.id}`)} />
      </PageBody>
    </>
  );
}
