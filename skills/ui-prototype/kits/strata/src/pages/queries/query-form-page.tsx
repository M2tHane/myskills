import { useNavigate, useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, Hand, Trash2 } from 'lucide-react';
import {
  ActionBar, Badge, Button, Card, Checkbox, DatePicker, DateRangePicker, Field, FormSection, Input, MultiSelect, PageBody, PageHeader, RadioGroup,
  Select, Skeleton, Textarea, toast, type DateRange,
} from '@/components/ui';
import { owners, sources, useCreateQuery, useDeleteQueries, useQueryDetail, useUpdateQuery } from '@/api/queries';
import { useUnsavedGuard } from '@/app/unsaved-guard';

/* ------------------------------------------------------------------ schema */

const SCHEDULES = [{ value: '每小时', label: '每小时' }, { value: '每天 02:00', label: '每天 02:00' }, { value: '每周一 08:00', label: '每周一 08:00' }, { value: '每月 1 日 06:00', label: '每月 1 日 06:00' }];
const TAGS = ['周报', '区域', '会员', '营销', '财务', '库存'].map((t) => ({ value: t, label: t }));

const schema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(40, '名称不超过 40 个字'),
  owner: z.string().min(1, '请选择负责人'),
  source: z.string().min(1, '请选择数据源'),
  tags: z.array(z.string()).max(3, '最多 3 个标签'),
  description: z.string().max(200, '描述不超过 200 个字'),
  mode: z.enum(['manual', 'scheduled']),
  schedule: z.string(),
  firstRun: z.date().optional(),
  period: z.object({ from: z.date(), to: z.date() }).optional(),
  sql: z.string().trim().min(1, '请输入 SQL'),
  notify: z.boolean(),
  recipients: z.array(z.string()),
}).superRefine((v, ctx) => {
  if (v.mode === 'scheduled' && !v.schedule) ctx.addIssue({ code: 'custom', path: ['schedule'], message: '请选择刷新频率' });
  if (v.notify && v.recipients.length === 0) ctx.addIssue({ code: 'custom', path: ['recipients'], message: '请选择接收人' });
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  name: '', owner: '张一鸣', source: '', tags: [], description: '', mode: 'manual', schedule: '', firstRun: undefined, period: undefined,
  sql: '', notify: true, recipients: ['张一鸣'],
};

/**
 * 新建 / 编辑表单页：路由 `/queries/new` 与 `/queries/:id/edit`。
 * 一张卡片里按 FormSection 分组（每组 2 列），底部 ActionBar 吸底；有未保存改动时离开会确认。
 */
export function QueryFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const { data, isPending } = useQueryDetail(id);
  if (editing && (isPending || !data)) return <FormSkeleton />;
  const initial: Values = data
    ? { ...EMPTY, name: data.name, owner: data.owner, source: data.source, mode: data.schedule === '手动' ? 'manual' : 'scheduled', schedule: data.schedule === '手动' ? '' : data.schedule, sql: `SELECT region, SUM(pay_amount) AS gmv\nFROM orders_daily\nGROUP BY region;` }
    : EMPTY;
  return <QueryForm key={id ?? 'new'} id={id} initial={initial} status={data ? { label: data.status, tone: data.tone } : undefined} />;
}

function QueryForm({ id, initial, status }: { id?: string; initial: Values; status?: { label: string; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' } }) {
  const navigate = useNavigate();
  const create = useCreateQuery();
  const update = useUpdateQuery();
  const del = useDeleteQueries();
  const { register, control, handleSubmit, watch, formState: { errors, isDirty, isSubmitSuccessful, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const guard = useUnsavedGuard(isDirty && !isSubmitSuccessful);
  const mode = watch('mode');
  const notify = watch('notify');

  const onSubmit = handleSubmit(async (v) => {
    const input = { name: v.name, source: v.source, owner: v.owner, schedule: v.mode === 'manual' ? '手动' : v.schedule, description: v.description };
    if (id) await update.mutateAsync({ id, input });
    else await create.mutateAsync(input);
    toast({ tone: 'success', title: id ? '已保存' : '已创建查询', description: v.name });
    guard.leave(() => navigate('/queries'));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      {guard.dialog}
      <PageHeader title={id ? '编辑查询' : '新建查询'} meta={status && <Badge tone={status.tone}>{status.label}</Badge>} />
      <PageBody>
        <Card>
          <FormSection title="基本信息" columns={2}>
            <Field label="名称" required error={errors.name?.message}>
              <Input placeholder="例如 华东区域订单" invalid={!!errors.name} {...register('name')} />
            </Field>
            <Field label="负责人" required error={errors.owner?.message}>
              <Controller name="owner" control={control} render={({ field }) => (
                <Select options={owners.map((o) => ({ value: o, label: o }))} value={field.value || undefined} onValueChange={field.onChange} invalid={!!errors.owner} />
              )} />
            </Field>
            <Field label="数据源" required error={errors.source?.message}>
              <Controller name="source" control={control} render={({ field }) => (
                <Select placeholder="选择数据源" options={sources.map((s) => ({ value: s, label: s }))} value={field.value || undefined} onValueChange={field.onChange} invalid={!!errors.source} />
              )} />
            </Field>
            <Field label="标签" error={errors.tags?.message}>
              <Controller name="tags" control={control} render={({ field }) => (
                <MultiSelect placeholder="选择标签" options={TAGS} value={field.value} onValueChange={field.onChange} invalid={!!errors.tags} />
              )} />
            </Field>
            <Field label="描述" span={2} aside={`${watch('description').length} / 200`} error={errors.description?.message}>
              <Textarea rows={2} maxLength={200} placeholder="这个查询回答什么问题" invalid={!!errors.description} {...register('description')} />
            </Field>
          </FormSection>

          <FormSection title="运行" columns={2}>
            <Field label="运行方式" span={2}>
              <Controller name="mode" control={control} render={({ field }) => (
                <RadioGroup variant="card" columns={2} value={field.value} onValueChange={field.onChange}
                  options={[{ value: 'manual', label: '手动运行', icon: <Hand /> }, { value: 'scheduled', label: '定时运行', icon: <CalendarClock /> }]} />
              )} />
            </Field>
            {mode === 'scheduled' && <>
              <Field label="刷新频率" required error={errors.schedule?.message}>
                <Controller name="schedule" control={control} render={({ field }) => (
                  <Select placeholder="选择频率" options={SCHEDULES} value={field.value || undefined} onValueChange={field.onChange} invalid={!!errors.schedule} />
                )} />
              </Field>
              <Field label="首次运行">
                <Controller name="firstRun" control={control} render={({ field }) => <DatePicker value={field.value} onValueChange={field.onChange} min={new Date()} />} />
              </Field>
              <Field label="生效期间">
                <Controller name="period" control={control} render={({ field }) => (
                  <DateRangePicker value={field.value as DateRange | undefined} onValueChange={field.onChange} presets={false} min={new Date()} />
                )} />
              </Field>
            </>}
          </FormSection>

          <FormSection title="SQL">
            <Field label="查询语句" required error={errors.sql?.message}>
              <Textarea mono rows={7} placeholder="SELECT …" invalid={!!errors.sql} {...register('sql')} />
            </Field>
          </FormSection>

          <FormSection title="通知" columns={2}>
            <Field label="运行失败时" span={2}>
              <Controller name="notify" control={control} render={({ field }) => <Checkbox label="通知接收人" checked={field.value} onCheckedChange={field.onChange} />} />
            </Field>
            {notify && (
              <Field label="接收人" required error={errors.recipients?.message}>
                <Controller name="recipients" control={control} render={({ field }) => (
                  <MultiSelect options={owners.map((o) => ({ value: o, label: o }))} value={field.value} onValueChange={field.onChange} invalid={!!errors.recipients} searchPlaceholder="搜索成员" />
                )} />
              </Field>
            )}
          </FormSection>
        </Card>
      </PageBody>
      <ActionBar start={id && (
        <Button variant="destructive-outline" leftIcon={<Trash2 />} loading={del.isPending}
          onClick={async () => { await del.mutateAsync([id]); toast({ tone: 'info', title: '已删除查询' }); guard.leave(() => navigate('/queries')); }}>删除</Button>
      )}>
        <Button onClick={() => navigate('/queries')}>取消</Button>
        <Button type="submit" variant="default" loading={isSubmitting} disabled={!!id && !isDirty}>{id ? '保存' : '创建'}</Button>
      </ActionBar>
    </form>
  );
}

function FormSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="编辑查询" />
      <PageBody><Skeleton className="h-[520px] rounded-md" /></PageBody>
    </div>
  );
}
