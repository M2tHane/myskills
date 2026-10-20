import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Badge, Button, Card, DescriptionList, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, PageBody, PageHeader, Skeleton, toast,
  type BadgeTone,
} from '@/components/ui';
import { use__Name__Detail, type __Name__Status } from '@/api/__kebab__';
import { LoadFailed, NotFoundPage } from '@/pages/errors/error-pages';

const TONE: Record<__Name__Status, BadgeTone> = { 启用: 'success', 待审核: 'warning', 停用: 'neutral' };

/**
 * __title__：路由 `__route__`。由 scripts/new-page.mjs 生成，标了 TODO(prd) 的地方照 PRD 页面规格填。
 * 按钮：跳转的（编辑）真的跳；弹窗的（删除）打开弹窗；改数据的（弹窗里的确认）只弹提示，数据不变。
 */
export function __Name__DetailPage() {
  const id = useParams().__param__;
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = use__Name__Detail(id);
  const [deleting, setDeleting] = React.useState(false);

  // 四种状态：加载中 → 同尺寸骨架；出错、无权限 → LoadFailed；找不到 → 404（原型里用 ?state= 切换；empty 不清空单个对象）
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  if (isPending) return <DetailSkeleton />;
  if (!data) return <NotFoundPage />;

  // TODO(prd) 页头操作照页面规格
  const actions = (
    <>
      <Button variant="destructive-outline" leftIcon={<Trash2 />} onClick={() => setDeleting(true)}>删除</Button>
      <Button variant="default" leftIcon={<Pencil />} onClick={() => navigate(`__base__/${data.id}/edit`)}>编辑</Button>
    </>
  );
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

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent size="sm">
          <DialogHeader tone="danger"><DialogTitle>删除这个__noun__？</DialogTitle></DialogHeader>
          <DialogBody indent>「{data.name}」将被删除。</DialogBody>
          <DialogFooter>
            <Button onClick={() => setDeleting(false)}>取消</Button>
            <Button variant="destructive" onClick={() => { setDeleting(false); toast({ tone: 'success', title: '已删除', description: data.name }); }}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
