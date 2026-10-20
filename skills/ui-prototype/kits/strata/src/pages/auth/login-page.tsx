import * as React from 'react';
import { useNavigate } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LockKeyhole, MessageSquare, UserRound } from 'lucide-react';
import { Alert, BarChart, Button, Card, Checkbox, Field, Input, Mark, StatCard } from '@/components/ui';
import { useLogin } from '@/api/auth';

const schema = z.object({
  account: z.string().trim().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

const PREVIEW = Array.from({ length: 14 }, (_, i) => ({ label: `10/${i + 6}`, value: Math.round(900 + Math.sin(i / 2) * 160 + i * 22) }));

/**
 * 登录页：路由 `/login`，在外框之外。左侧灰色画布（左上角 Logo）放一块由真实组件拼成的产品预览，右侧 480px 白色表单栏。
 * 错误统一显示在表单上方（可关闭）；字段错误显示在字段下。演示密码：strata。
 */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = React.useState<string>();
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { account: '', password: '', remember: true },
  });
  const onSubmit = handleSubmit(async (v) => {
    setError(undefined);
    try { await login.mutateAsync(v); navigate('/'); } catch (e) { setError((e as Error).message); }
  });

  return (
    <div className="flex font-sans" style={{ height: 'var(--app-height, 100vh)' }}>
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-canvas p-12">
        <div className="absolute top-10 left-12 flex items-center gap-2.5"><Mark size={28} /><span className="text-body font-semibold text-fg">运营数据中心</span></div>
        <div className="flex w-full max-w-[720px] flex-col gap-4" aria-hidden>
          <div className="text-title-2 font-semibold text-fg">查询、数据资产与指标，在一处管理</div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="今日查询" value="1,284" delta="+12.4%" deltaGood compare="较昨日" />
            <StatCard label="平均耗时" value="2.4" unit="s" delta="−0.3 s" deltaGood compare="较上周" />
            <StatCard label="成功率" value="99.2" unit="%" delta="−0.4 pt" deltaGood={false} compare="较上周" />
          </div>
          <Card title="每日查询量"><BarChart data={PREVIEW} height={180} labelEvery={2} /></Card>
        </div>
      </div>
      <div className="flex w-[480px] shrink-0 flex-col border-l border-border bg-surface px-14 py-10">
        <form onSubmit={onSubmit} noValidate className="my-auto flex flex-col gap-4">
          <h1 className="m-0 mb-2 text-title-1 font-semibold tracking-[-0.015em] text-fg">登录</h1>
          {error && <Alert tone="danger" title={error} onClose={() => setError(undefined)} />}
          <Field label="账号" error={errors.account?.message}>
            <Input size="lg" leftIcon={<UserRound />} placeholder="邮箱或手机号" autoComplete="username" invalid={!!errors.account} {...register('account')} />
          </Field>
          <Field label="密码" aside={<a href="#" onClick={(e) => e.preventDefault()} className="text-body-sm text-link no-underline hover:underline">忘记密码</a>} error={errors.password?.message}>
            <Input size="lg" type="password" leftIcon={<LockKeyhole />} autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
          </Field>
          <Controller name="remember" control={control} render={({ field }) => <Checkbox label="7 天内自动登录" checked={field.value} onCheckedChange={field.onChange} />} />
          <Button type="submit" variant="default" size="lg" loading={login.isPending} className="mt-2 w-full">登录</Button>
          <div className="flex items-center gap-3 text-caption text-fg-subtle"><span className="h-px flex-1 bg-border-subtle" />或<span className="h-px flex-1 bg-border-subtle" /></div>
          <Button size="lg" leftIcon={<MessageSquare />} className="w-full">企业微信登录</Button>
        </form>
      </div>

    </div>
  );
}
