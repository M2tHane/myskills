import { Navigate, useNavigate, useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Building2, ShieldCheck } from 'lucide-react';
import {
  Button, Card, Checkbox, Field, Input, MultiSelect, PageBody, PageHeader, RadioGroup, Select, Skeleton, Textarea, VerticalNav, toast,
} from '@/components/ui';
import { owners, sources } from '@/api/queries';
import { useSaveSettings, useSettings, type Settings } from '@/api/settings';
import { UnsavedGuard } from '@/app/unsaved-guard';

const SECTIONS = [
  { title: '工作区', items: [{ value: 'general', label: '常规', icon: <Building2 /> }, { value: 'notifications', label: '通知', icon: <Bell /> }] },
  { title: '安全', items: [{ value: 'security', label: '安全与访问', icon: <ShieldCheck /> }] },
];
const LABEL_W = 136;

/**
 * 设置页：路由 `/settings/:section`。左侧 VerticalNav 切换分组（每组独占内容区，不堆在一页），
 * 右侧是横排表单卡片（标签在左，宽 136），保存按钮在卡片底部，只有改动后才可点。
 */
export function SettingsPage() {
  const { section = 'general' } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useSettings();
  if (!SECTIONS.some((s) => s.items.some((i) => i.value === section))) return <Navigate to="/settings/general" replace />;
  return (
    <>
      <PageHeader title="设置" />
      <PageBody>
        <div className="flex items-start gap-6">
          <VerticalNav sections={SECTIONS} value={section} onValueChange={(v) => navigate(`/settings/${v}`)} className="sticky top-4" />
          <div className="min-w-0 flex-1">
            {isPending || !data ? <Skeleton className="h-96 rounded-md" />
              : section === 'general' ? <GeneralForm key="g" values={data.workspace} />
              : section === 'notifications' ? <NotificationForm key="n" values={data.notifications} />
              : <SecurityForm key="s" values={data.security} />}
          </div>
        </div>
      </PageBody>
    </>
  );
}

/** 卡片底部：取消（还原）+ 保存。 */
function SaveFooter({ dirty, saving, onReset }: { dirty: boolean; saving: boolean; onReset: () => void }) {
  return <><span /><span className="flex gap-2"><Button disabled={!dirty} onClick={onReset}>取消</Button><Button type="submit" variant="default" disabled={!dirty} loading={saving}>保存</Button></span></>;
}

function useSectionForm<K extends keyof Settings>(section: K, schema: z.ZodType<Settings[K]>, values: Settings[K]) {
  const save = useSaveSettings();
  const form = useForm<Settings[K]>({ resolver: zodResolver(schema as never), defaultValues: values as never });
  const submit = form.handleSubmit(async (v) => {
    await save.mutateAsync({ section, values: v } as never);
    form.reset(v);
    toast({ tone: 'success', title: '已保存设置' });
  });
  return { form, submit, saving: save.isPending };
}

/* ------------------------------------------------------------------ 常规 */

const TIMEZONES = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Dubai', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC']
  .map((z) => ({ value: z, label: z }));
const generalSchema = z.object({
  name: z.string().trim().min(1, '请输入工作区名称').max(30, '不超过 30 个字'),
  slug: z.string().regex(/^[a-z0-9-]{3,24}$/, '3–24 位小写字母、数字或连字符'),
  timezone: z.string(), language: z.string(), defaultSource: z.string(), weekStart: z.string(),
});

function GeneralForm({ values }: { values: Settings['workspace'] }) {
  const { form, submit, saving } = useSectionForm('workspace', generalSchema, values);
  const { register, control, reset, formState: { errors, isDirty } } = form;
  return (
    <form onSubmit={submit} noValidate>
      <UnsavedGuard when={isDirty} />
      <Card title="常规" footer={<SaveFooter dirty={isDirty} saving={saving} onReset={() => reset()} />}>
        <div className="flex max-w-[640px] flex-col gap-4">
          <Field orientation="horizontal" labelWidth={LABEL_W} label="工作区名称" required error={errors.name?.message}><Input invalid={!!errors.name} {...register('name')} /></Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="访问地址" required error={errors.slug?.message}><Input addonBefore="strata.app/" invalid={!!errors.slug} {...register('slug')} /></Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="时区">
            <Controller name="timezone" control={control} render={({ field }) => <Select options={TIMEZONES} value={field.value} onValueChange={field.onChange} searchPlaceholder="搜索时区" />} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="界面语言">
            <Controller name="language" control={control} render={({ field }) => (
              <RadioGroup orientation="horizontal" value={field.value} onValueChange={field.onChange} options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English' }]} />
            )} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="默认数据源">
            <Controller name="defaultSource" control={control} render={({ field }) => <Select options={sources.map((s) => ({ value: s, label: s }))} value={field.value} onValueChange={field.onChange} />} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="每周开始于">
            <Controller name="weekStart" control={control} render={({ field }) => <Select options={[{ value: 'monday', label: '周一' }, { value: 'sunday', label: '周日' }]} value={field.value} onValueChange={field.onChange} />} />
          </Field>
        </div>
      </Card>
    </form>
  );
}

/* ------------------------------------------------------------------ 通知 */

const notifySchema = z.object({
  failed: z.boolean(), slow: z.boolean(), quota: z.boolean(), weekly: z.boolean(),
  channel: z.string(), recipients: z.array(z.string()).min(1, '至少选择 1 位接收人'),
});

function NotificationForm({ values }: { values: Settings['notifications'] }) {
  const { form, submit, saving } = useSectionForm('notifications', notifySchema, values);
  const { control, reset, formState: { errors, isDirty } } = form;
  const cb = (name: 'failed' | 'slow' | 'quota' | 'weekly', label: string) => (
    <Controller name={name} control={control} render={({ field }) => <Checkbox label={label} checked={field.value} onCheckedChange={field.onChange} />} />
  );
  return (
    <form onSubmit={submit} noValidate>
      <UnsavedGuard when={isDirty} />
      <Card title="通知" footer={<SaveFooter dirty={isDirty} saving={saving} onReset={() => reset()} />}>
        <div className="flex max-w-[640px] flex-col gap-4">
          <Field orientation="horizontal" labelWidth={LABEL_W} label="通知我">
            <div className="flex flex-col gap-2.5 py-1.5">
              {cb('failed', '查询运行失败')}
              {cb('slow', '查询超过 30 秒')}
              {cb('quota', '用量超过 90%')}
              {cb('weekly', '每周使用报告')}
            </div>
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="通知方式">
            <Controller name="channel" control={control} render={({ field }) => (
              <RadioGroup orientation="horizontal" value={field.value} onValueChange={field.onChange} options={[{ value: 'email', label: '邮件' }, { value: 'wecom', label: '企业微信' }, { value: 'inbox', label: '站内信' }]} />
            )} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="接收人" required error={errors.recipients?.message}>
            <Controller name="recipients" control={control} render={({ field }) => (
              <MultiSelect options={owners.map((o) => ({ value: o, label: o }))} value={field.value} onValueChange={field.onChange} invalid={!!errors.recipients} searchPlaceholder="搜索成员" />
            )} />
          </Field>
        </div>
      </Card>
    </form>
  );
}

/* ------------------------------------------------------------------ 安全 */

const securitySchema = z.object({
  sessionHours: z.string(), twoFactor: z.boolean(), exportApproval: z.boolean(),
  ipAllowlist: z.string().refine((s) => s.split('\n').filter(Boolean).every((l) => /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(l.trim())), '每行一个 IP 或网段，如 10.20.0.0/16'),
});

function SecurityForm({ values }: { values: Settings['security'] }) {
  const { form, submit, saving } = useSectionForm('security', securitySchema, values);
  const { register, control, reset, formState: { errors, isDirty } } = form;
  return (
    <form onSubmit={submit} noValidate>
      <UnsavedGuard when={isDirty} />
      <Card title="安全与访问" footer={<SaveFooter dirty={isDirty} saving={saving} onReset={() => reset()} />}>
        <div className="flex max-w-[640px] flex-col gap-4">
          <Field orientation="horizontal" labelWidth={LABEL_W} label="登录有效期">
            <Controller name="sessionHours" control={control} render={({ field }) => (
              <Select options={[{ value: '2', label: '2 小时' }, { value: '8', label: '8 小时' }, { value: '24', label: '24 小时' }, { value: '168', label: '7 天' }]} value={field.value} onValueChange={field.onChange} />
            )} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="两步验证">
            <Controller name="twoFactor" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} label="所有成员必须开启" />} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="导出审批">
            <Controller name="exportApproval" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} label="导出超过 1 万行需要管理员审批" />} />
          </Field>
          <Field orientation="horizontal" labelWidth={LABEL_W} label="IP 白名单" error={errors.ipAllowlist?.message}>
            <Textarea mono rows={4} invalid={!!errors.ipAllowlist} {...register('ipAllowlist')} />
          </Field>
        </div>
      </Card>
    </form>
  );
}
