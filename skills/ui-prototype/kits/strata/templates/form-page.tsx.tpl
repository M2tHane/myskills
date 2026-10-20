import { useNavigate, useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import { ActionBar, Button, Card, Field, FormSection, Input, PageBody, PageHeader, Select, Skeleton, Textarea, toast } from '@/components/ui';
import { __camel__Statuses, useCreate__Name__, useDelete__Name__, use__Name__Detail, useUpdate__Name__, type __Name__Input } from '@/api/__kebab__';
import { useCurrentUser } from '@/api/session';
import { useUnsavedGuard } from '@/app/unsaved-guard';
import { LoadFailed, NotFoundPage } from '@/pages/errors/error-pages';

// TODO(prd) 字段和校验照页面规格；字段多时分几个 FormSection
const schema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(40, '名称不超过 40 个字'),
  status: z.enum(__camel__Statuses),
  owner: z.string().trim().min(1, '请输入负责人'),
  note: z.string().max(200, '备注不超过 200 个字'),
});
type Values = z.infer<typeof schema>;

/**
 * __title__：路由 `__route__`。由 scripts/new-page.mjs 生成，标了 TODO(prd) 的地方照 PRD 页面规格填。
 * 新建和编辑共用：地址里有 id 是编辑。有未保存的改动时离开会确认。
 */
export function __Name__FormPage() {
  const id = useParams().__param__;
  const editing = !!id;
  const me = useCurrentUser();
  const { data, isPending, isError, error, refetch } = use__Name__Detail(id);
  // 编辑时先读数据：出错、无权限 → LoadFailed；加载中 → 骨架；找不到 → 404
  if (editing && isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  if (editing && isPending) return <FormSkeleton />;
  if (editing && !data) return <NotFoundPage />;
  const initial: Values = data
    ? { name: data.name, status: data.status, owner: data.owner, note: data.note }
    : { name: '', status: __camel__Statuses[0], owner: me.name, note: '' };
  return <__Name__Form key={id ?? 'new'} id={id} initial={initial} />;
}

function __Name__Form({ id, initial }: { id?: string; initial: Values }) {
  const navigate = useNavigate();
  const create = useCreate__Name__();
  const update = useUpdate__Name__();
  const del = useDelete__Name__();
  const { register, control, handleSubmit, formState: { errors, isDirty, isSubmitSuccessful, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const guard = useUnsavedGuard(isDirty && !isSubmitSuccessful);
  const back = () => navigate('__base__');

  const onSubmit = handleSubmit(async (v) => {
    const input: __Name__Input = v;
    try {
      if (id) await update.mutateAsync({ id, input });
      else await create.mutateAsync(input);
    } catch (e) {
      toast({ tone: 'danger', title: id ? '保存失败' : '创建失败', description: e instanceof Error ? e.message : String(e) });
      throw e;
    }
    toast({ tone: 'success', title: id ? '已保存' : '已创建__noun__', description: v.name });
    guard.leave(back);
  });

  return (
    <form onSubmit={(e) => void onSubmit(e).catch(() => {})} noValidate className="flex min-h-full flex-col">
      {guard.dialog}
      <PageHeader title={id ? '编辑__noun__' : '新建__noun__'} />
      <PageBody>
        <Card>
          <FormSection title="基本信息" columns={2}>
            <Field label="名称" required error={errors.name?.message}>
              <Input invalid={!!errors.name} {...register('name')} />
            </Field>
            <Field label="状态" required error={errors.status?.message}>
              <Controller name="status" control={control} render={({ field }) => (
                <Select options={__camel__Statuses.map((s) => ({ value: s, label: s }))} value={field.value} onValueChange={field.onChange} invalid={!!errors.status} />
              )} />
            </Field>
            <Field label="负责人" required error={errors.owner?.message}>
              <Input invalid={!!errors.owner} {...register('owner')} />
            </Field>
            <Field label="备注" span={2} error={errors.note?.message}>
              <Textarea rows={3} maxLength={200} invalid={!!errors.note} {...register('note')} />
            </Field>
          </FormSection>
        </Card>
      </PageBody>
      <ActionBar start={id && (
        <Button variant="destructive-outline" leftIcon={<Trash2 />} loading={del.isPending}
          onClick={async () => { await del.mutateAsync(id); toast({ tone: 'info', title: '已删除__noun__' }); guard.leave(back); }}>删除</Button>
      )}>
        <Button onClick={back}>取消</Button>
        <Button type="submit" variant="default" loading={isSubmitting} disabled={!!id && !isDirty}>{id ? '保存' : '创建'}</Button>
      </ActionBar>
    </form>
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
