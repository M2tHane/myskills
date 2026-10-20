import { useNavigate, useParams } from 'react-router';
import { ActionBar, Button, Card, Field, FormSection, Input, PageBody, PageHeader, Select, Skeleton, Textarea, toast } from '@/components/ui';
import { __camel__Statuses, use__Name__Detail } from '@/api/__kebab__';
import { LoadFailed, NotFoundPage } from '@/pages/errors/error-pages';

/**
 * __title__：路由 `__route__`。由 scripts/new-page.mjs 生成，标了 TODO(prd) 的地方照 PRD 页面规格填。
 * 原型里的表单只画字段：不做校验，「创建 / 保存」弹提示后回到列表，数据不变。地址里有 id 是编辑，先读出数据填进去。
 */
export function __Name__FormPage() {
  const id = useParams().__param__;
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = use__Name__Detail(id);
  // 编辑时先读数据：出错、无权限 → LoadFailed；加载中 → 骨架；找不到 → 404
  if (id && isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  if (id && isPending) return <FormSkeleton />;
  if (id && !data) return <NotFoundPage />;
  const back = () => navigate('__base__');
  const save = () => { toast({ tone: 'success', title: id ? '已保存' : '已创建__noun__' }); back(); };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={id ? '编辑__noun__' : '新建__noun__'} />
      <PageBody>
        <Card>
          {/* TODO(prd) 字段照页面规格；字段多时分几个 FormSection */}
          <FormSection title="基本信息" columns={2}>
            <Field label="名称" required><Input defaultValue={data?.name} placeholder="请输入名称" /></Field>
            <Field label="状态" required><Select options={__camel__Statuses.map((s) => ({ value: s, label: s }))} defaultValue={data?.status ?? __camel__Statuses[0]} /></Field>
            <Field label="负责人" required><Input defaultValue={data?.owner} /></Field>
            <Field label="备注" span={2}><Textarea rows={3} defaultValue={data?.note} /></Field>
          </FormSection>
        </Card>
      </PageBody>
      <ActionBar>
        <Button onClick={back}>取消</Button>
        <Button variant="default" onClick={save}>{id ? '保存' : '创建'}</Button>
      </ActionBar>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="编辑__noun__" />
      <PageBody><Skeleton className="h-96 rounded-md" /></PageBody>
    </div>
  );
}
