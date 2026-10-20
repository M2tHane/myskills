import * as React from 'react';
import { useNavigate } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Database, PlugZap, Search, Table } from 'lucide-react';
import {
  ActionBar, Alert, Badge, Button, Card, Checkbox, DescriptionList, Field, FormSection, Input, PageBody, PageHeader, RadioGroup, Select, Steps,
  Tree, toast, type TreeNode,
} from '@/components/ui';
import { useCreateSource, useRemoteTables, useTestConnection, type SourceKind } from '@/api/sources';
import { useUnsavedGuard } from '@/app/unsaved-guard';

const KINDS: Array<{ value: SourceKind; label: string; port: string }> = [
  { value: 'postgres', label: 'PostgreSQL', port: '5432' },
  { value: 'mysql', label: 'MySQL', port: '3306' },
  { value: 'clickhouse', label: 'ClickHouse', port: '8123' },
];
const STEPS = [{ title: '选择类型' }, { title: '配置连接' }, { title: '选择数据表' }, { title: '确认' }];

const schema = z.object({
  kind: z.enum(['postgres', 'mysql', 'clickhouse', 'csv']),
  name: z.string().trim().min(1, '请输入名称').regex(/^[a-z0-9-]+$/, '只能用小写字母、数字和连字符'),
  host: z.string().trim().min(1, '请输入主机地址'),
  port: z.string().regex(/^\d{2,5}$/, '端口为 2–5 位数字'),
  database: z.string().trim().min(1, '请输入数据库名'),
  user: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  ssl: z.boolean(),
  tables: z.array(z.string()).min(1, '至少选择 1 张数据表'),
  schedule: z.string(),
});
type Values = z.infer<typeof schema>;
/** 每一步要校验的字段。 */
const STEP_FIELDS: Array<Array<keyof Values>> = [['kind'], ['name', 'host', 'port', 'database', 'user', 'password'], ['tables'], []];

/**
 * 分步向导：路由 `/data/sources/new`。一个表单贯穿所有步骤，每步「下一步」只校验本步字段；
 * 第 2 步必须测试连接成功才能继续；底部 ActionBar：左侧上一步，右侧取消 + 下一步 / 创建。
 */
export function SourceWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);
  const test = useTestConnection();
  const create = useCreateSource();
  const remote = useRemoteTables(step >= 2);
  const [kw, setKw] = React.useState('');
  const { register, control, handleSubmit, trigger, watch, setValue, getValues, formState: { errors, isDirty, isSubmitSuccessful } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { kind: 'postgres', name: '', host: '', port: '5432', database: '', user: '', password: '', ssl: true, tables: [], schedule: '每天 02:00' },
  });
  const guard = useUnsavedGuard(isDirty && !isSubmitSuccessful);
  const kind = watch('kind');
  const tables = watch('tables');
  const tested = test.isSuccess;

  // 连接参数改了，之前的测试结果作废
  React.useEffect(() => { const sub = watch((_, { name }) => { if (name && ['host', 'port', 'database', 'user', 'password', 'kind'].includes(name)) test.reset(); }); return () => sub.unsubscribe(); }, [watch, test]);

  const tree: TreeNode[] = (remote.data ?? []).map((s) => ({
    id: 'schema:' + s.schema, label: s.schema, icon: <Database />, meta: s.tables.length,
    children: s.tables.map(([t, rows]) => ({ id: `${s.schema}.${t}`, label: t, icon: <Table />, meta: rows })),
  }));
  const total = tree.reduce((a, s) => a + (s.children?.length ?? 0), 0);

  const next = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) return;
    if (step === 1 && !tested) { try { await test.mutateAsync(getValues()); } catch { return; } }
    setStep(step + 1);
  };
  const submit = handleSubmit(async (v) => {
    const row = await create.mutateAsync(v);
    toast({ tone: 'success', title: '已创建数据源', description: `${row.name} · 正在同步 ${v.tables.length} 张数据表` });
    guard.leave(() => navigate('/data/sources'));
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (step === 3) submit(); else next(); }} noValidate className="flex min-h-full flex-col">
      {guard.dialog}
      <PageHeader title="新建数据源" />
      <PageBody>
        <Card padding="none">
          <div className="border-b border-border-subtle px-6 py-4"><Steps items={STEPS} current={step} /></div>
          <div className="p-6">
            {step === 0 && (
              <FormSection title="数据源类型">
                <Controller name="kind" control={control} render={({ field }) => (
                  <RadioGroup variant="card" columns={3} value={field.value}
                    onValueChange={(v) => { field.onChange(v); setValue('port', KINDS.find((k) => k.value === v)!.port); }}
                    options={KINDS.map((k) => ({ value: k.value, label: k.label, icon: <Database /> }))} />
                )} />
              </FormSection>
            )}

            {step === 1 && (
              <>
                <FormSection title="连接信息" columns={2}>
                  <Field label="名称" required error={errors.name?.message}><Input placeholder="例如 pg-prod-03" invalid={!!errors.name} {...register('name')} /></Field>
                  <Field label="类型"><Input value={KINDS.find((k) => k.value === kind)?.label} readOnly /></Field>
                  <Field label="主机" required error={errors.host?.message}><Input placeholder="10.20.8.14" invalid={!!errors.host} {...register('host')} /></Field>
                  <Field label="端口" required error={errors.port?.message}><Input invalid={!!errors.port} {...register('port')} /></Field>
                  <Field label="数据库" required error={errors.database?.message}><Input invalid={!!errors.database} {...register('database')} /></Field>
                  <Field label="SSL"><Controller name="ssl" control={control} render={({ field }) => <Checkbox label="使用 SSL 连接" checked={field.value} onCheckedChange={field.onChange} />} /></Field>
                  <Field label="用户名" required error={errors.user?.message}><Input autoComplete="off" invalid={!!errors.user} {...register('user')} /></Field>
                  <Field label="密码" required error={errors.password?.message}><Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} /></Field>
                </FormSection>
                <div className="mt-5 flex flex-col gap-3">
                  <div><Button leftIcon={<PlugZap />} loading={test.isPending} onClick={async () => { if (await trigger(STEP_FIELDS[1])) test.mutate(getValues()); }}>测试连接</Button></div>
                  {test.isSuccess && <Alert tone="success" title="连接成功" onClose={() => test.reset()}>{test.data.version} · 延迟 {test.data.latency} ms</Alert>}
                  {test.isError && <Alert tone="danger" title="连接失败" onClose={() => test.reset()}>{(test.error as Error).message}</Alert>}
                </div>
              </>
            )}

            {step === 2 && (
              <div className="grid grid-cols-[minmax(0,1fr)_280px] items-start gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-60"><Input leftIcon={<Search />} placeholder="搜索数据表" value={kw} onChange={(e) => setKw(e.target.value)} clearable onClear={() => setKw('')} /></div>
                    <span className="flex-1" />
                    <span className="text-body-sm text-fg-muted tabular-nums">已选 <b className="font-semibold text-fg">{tables.length}</b> / {total}</span>
                    <Button size="sm" variant="ghost" onClick={() => setValue('tables', tables.length === total ? [] : tree.flatMap((s) => s.children!.map((c) => c.id)), { shouldDirty: true, shouldValidate: true })}>{tables.length === total ? '清空' : '全选'}</Button>
                  </div>
                  <div className="max-h-[360px] overflow-auto rounded-md border border-border p-1.5">
                    <Controller name="tables" control={control} render={({ field }) => (
                      <Tree data={tree} checkable checked={field.value} onCheckedChange={field.onChange} defaultExpanded="all" filter={kw} aria-label="数据表" />
                    )} />
                  </div>
                  {errors.tables && <span role="alert" className="text-caption text-danger">{errors.tables.message}</span>}
                </div>
                <FormSection title="同步">
                  <Field label="同步频率">
                    <Controller name="schedule" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} options={['每小时', '每天 02:00', '每周一 08:00', '手动'].map((v) => ({ value: v, label: v }))} />
                    )} />
                  </Field>
                </FormSection>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
                <DescriptionList bordered columns={2} items={[
                  { label: '名称', value: getValues('name'), mono: true }, { label: '类型', value: KINDS.find((k) => k.value === kind)?.label },
                  { label: '地址', value: `${getValues('host')}:${getValues('port')}`, mono: true }, { label: '数据库', value: getValues('database'), mono: true },
                  { label: '用户名', value: getValues('user'), mono: true }, { label: 'SSL', value: getValues('ssl') ? '开启' : '关闭' },
                  { label: '同步频率', value: getValues('schedule') }, { label: '连接测试', value: <Badge tone="success">通过</Badge> },
                ]} />
                <div className="flex flex-col gap-2">
                  <div className="text-body-sm font-semibold text-fg">数据表 <span className="font-normal text-fg-subtle tabular-nums">{tables.length}</span></div>
                  <div className="flex max-h-[240px] flex-wrap gap-1.5 overflow-auto">{tables.map((t) => <Badge key={t} icon={false} className="font-mono">{t}</Badge>)}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </PageBody>
      <ActionBar start={step > 0 && <Button leftIcon={<ArrowLeft />} onClick={() => setStep(step - 1)}>上一步</Button>}>
        <Button onClick={() => navigate('/data/sources')}>取消</Button>
        {step < 3
          ? <Button type="submit" variant="default" rightIcon={<ArrowRight />} loading={step === 1 && test.isPending}>{step === 1 && !tested ? '测试并继续' : '下一步'}</Button>
          : <Button type="submit" variant="default" loading={create.isPending}>创建数据源</Button>}
      </ActionBar>
    </form>
  );
}
