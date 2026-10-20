import { useNavigate, useParams } from 'react-router';
import { Pencil } from 'lucide-react';
import { Badge, Button, Card, DescriptionList, PageBody, PageHeader, Skeleton, type BadgeTone } from '@/components/ui';
import { use__Name__Detail, type __Name__Status } from '@/api/__kebab__';
import { LoadFailed, NotFoundPage } from '@/pages/errors/error-pages';

const TONE: Record<__Name__Status, BadgeTone> = { 启用: 'success', 待审核: 'warning', 停用: 'neutral' };

/** __title__：路由 `__route__`。由 scripts/new-page.mjs 生成，标了 TODO(prd) 的地方照 PRD 页面规格填。 */
export function __Name__DetailPage() {
  const id = useParams().__param__;
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = use__Name__Detail(id);

  // 四种状态：加载中 → 同尺寸骨架；出错、无权限 → LoadFailed；找不到 → 404（原型里用 ?state= 切换；empty 不清空单个对象）
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  if (isPending) return <DetailSkeleton />;
  if (!data) return <NotFoundPage />;

  // TODO(prd) 页头操作；子模块多时在 PageHeader 加 Tabs
  const actions = <Button variant="default" leftIcon={<Pencil />} onClick={() => navigate(`__base__/${data.id}/edit`)}>编辑</Button>;
  return (
    <>
      <PageHeader title={data.name} meta={<Badge tone={TONE[data.status]}>{data.status}</Badge>} actions={actions} />
      <PageBody>
        {/* TODO(prd) 信息分组和关联列表照页面规格；两栏时用 1.6 : 1 */}
        <Card title="基本信息">
          <DescriptionList bordered columns={2} items={[
            { label: '编号', value: data.code, mono: true }, { label: '状态', value: data.status },
            { label: '负责人', value: data.owner }, { label: '更新时间', value: data.updated },
            { label: '备注', value: data.note || '—', span: 2 },
          ]} />
        </Card>
      </PageBody>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <PageHeader title={<Skeleton className="h-7 w-48" />} />
      <PageBody><Skeleton className="h-60 rounded-md" /></PageBody>
    </>
  );
}
