import { useNavigate } from 'react-router';
import { Database, Plus } from 'lucide-react';
import { Badge, Button, DataTable, EmptyState, PageBody, PageHeader, type Column } from '@/components/ui';
import { useSources, type SourceRow } from '@/api/sources';
import { LoadFailed } from '@/pages/errors/error-pages';

const KIND: Record<SourceRow['kind'], string> = { postgres: 'PostgreSQL', mysql: 'MySQL', clickhouse: 'ClickHouse', csv: 'CSV' };

/** 数据源列表：路由 `/data/sources`。「新建数据源」进入分步向导 `/data/sources/new`。 */
export function SourceListPage() {
  const navigate = useNavigate();
  const { data = [], isPending, isError, error, refetch } = useSources();
  const columns: Column<SourceRow>[] = [
    { key: 'name', title: '名称', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'kind', title: '类型', width: 120, render: (r) => <Badge icon={false}>{KIND[r.kind]}</Badge> },
    { key: 'host', title: '地址', width: 168, render: (r) => <span className="font-mono text-code text-fg-muted">{r.host}</span> },
    { key: 'database', title: '数据库', width: 120, render: (r) => <span className="font-mono text-code">{r.database}</span> },
    { key: 'tables', title: '数据表', width: 88, numeric: true, sortable: true },
    { key: 'status', title: '状态', width: 108, render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
    { key: 'owner', title: '负责人', width: 96 },
    { key: 'updated', title: '更新时间', width: 148, sortable: true, render: (r) => <span className="text-fg-subtle tabular-nums">{r.updated}</span> },
  ];
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  return (
    <>
      <PageHeader title="数据源" actions={<Button variant="default" leftIcon={<Plus />} onClick={() => navigate('/data/sources/new')}>新建数据源</Button>} />
      <PageBody>
        <DataTable columns={columns} data={data} rowKey={(r) => r.id} loading={isPending} pagination={false}
          empty={<EmptyState size="sm" icon={<Database />} title="还没有数据源" action={<Button size="sm" leftIcon={<Plus />} onClick={() => navigate('/data/sources/new')}>新建数据源</Button>} />} />
      </PageBody>
    </>
  );
}
