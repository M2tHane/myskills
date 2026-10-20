import * as React from 'react';
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from 'react-router';
import { ArrowLeft, FileQuestion, House, RotateCw, ShieldX, TriangleAlert } from 'lucide-react';
import { Button, Mark } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * 403 / 404 / 出错页。在外框内时占据内容区（侧栏与顶栏照常可用）；在外框外（standalone）时整页居中并带 Logo。
 * 结构固定：图标块 · 状态码 · 标题 · 一行事实（路径、错误信息）· 两个按钮（主操作 + 返回）。
 */
function StatusView({ icon, code, title, fact, actions, standalone, tone = 'neutral' }: {
  icon: React.ReactNode; code: string; title: string; fact?: React.ReactNode; actions: React.ReactNode; standalone?: boolean; tone?: 'neutral' | 'danger' | 'warning';
}) {
  const body = (
    <div className="flex flex-col items-center text-center">
      <span className={cn('mb-5 inline-flex size-14 items-center justify-center rounded-lg border shadow-xs [&_svg]:size-6',
        tone === 'danger' ? 'border-danger-line bg-danger-soft text-danger' : tone === 'warning' ? 'border-warning-line bg-warning-soft text-warning' : 'border-border bg-surface text-fg-muted')}>{icon}</span>
      <span className="mb-1.5 font-mono text-caption font-medium tracking-[.08em] text-fg-subtle">{code}</span>
      <h1 className="m-0 text-title-1 font-semibold tracking-[-0.015em] text-fg">{title}</h1>
      {fact && <div className="mt-3 max-w-[520px] rounded-sm border border-border-subtle bg-surface-sunken px-3 py-1.5 font-mono text-code text-fg-muted">{fact}</div>}
      <div className="mt-6 flex items-center gap-2">{actions}</div>
    </div>
  );
  if (!standalone) return <div className="flex min-h-full items-center justify-center px-6 pb-[12vh]">{body}</div>;
  return (
    <div className="flex flex-col bg-canvas font-sans" style={{ height: 'var(--app-height, 100vh)' }}>
      <div className="flex h-(--header-height) items-center gap-2.5 border-b border-border bg-surface px-6"><Mark size={24} /><span className="text-body-sm font-semibold text-fg">运营数据中心</span></div>
      <div className="flex flex-1 items-center justify-center pb-[10vh]">{body}</div>
    </div>
  );
}

export function NotFoundPage({ standalone }: { standalone?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <StatusView standalone={standalone} icon={<FileQuestion />} code="404" title="页面不存在" fact={pathname}
      actions={<><Button variant="default" leftIcon={<House />} onClick={() => navigate('/')}>返回首页</Button><Button leftIcon={<ArrowLeft />} onClick={() => navigate(-1)}>返回上一页</Button></>} />
  );
}

export function ForbiddenPage({ fact = '成员与权限 · 需要管理员角色' }: { fact?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <StatusView icon={<ShieldX />} tone="warning" code="403" title="没有访问权限" fact={fact}
      actions={<><Button variant="default">申请权限</Button><Button leftIcon={<House />} onClick={() => navigate('/')}>返回首页</Button></>} />
  );
}

/** 页面数据读取失败时代替整个页面内容：403 显示无权限，其他错误显示「重试」。用法：if (isError) return <LoadFailed error={error} onRetry={refetch} />。 */
export function LoadFailed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const navigate = useNavigate();
  const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status: unknown }).status : undefined;
  const msg = error instanceof Error ? error.message : String(error);
  if (status === 403) return <ForbiddenPage fact={msg} />;
  return (
    <StatusView icon={<TriangleAlert />} tone="danger" code={typeof status === 'number' ? String(status) : 'ERROR'} title="加载失败" fact={msg}
      actions={<><Button variant="default" leftIcon={<RotateCw />} onClick={onRetry}>重试</Button><Button leftIcon={<House />} onClick={() => navigate('/')}>返回首页</Button></>} />
  );
}

/** 路由 errorElement：页面渲染或数据加载抛错时显示。 */
export function RouteErrorPage() {
  const err = useRouteError();
  const navigate = useNavigate();
  const msg = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : String(err);
  if (isRouteErrorResponse(err) && err.status === 404) return <NotFoundPage standalone />;
  return (
    <StatusView standalone icon={<TriangleAlert />} tone="danger" code="ERROR" title="页面加载出错" fact={msg}
      actions={<><Button variant="default" leftIcon={<RotateCw />} onClick={() => window.location.reload()}>重新加载</Button><Button leftIcon={<House />} onClick={() => navigate('/')}>返回首页</Button></>} />
  );
}
