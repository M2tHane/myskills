import type { RouteObject } from 'react-router';
import { PageHeader } from '@/components/ui';
import { AppLayout, type RouteHandle } from './app-layout';
import { NotFoundPage, RouteErrorPage } from '@/pages/errors/error-pages';

const h = (handle: RouteHandle) => handle;

/**
 * 路由表：每个页面一条，路径与 PRD 页面表的「路由」一致。登录页放在外框（AppLayout）之外，
 * 其余页面是它的子路由，每级写 handle.crumb（面包屑），最后是 path: '*' 的 404。完整样例见 Strata 套件的 src/app/routes.tsx。
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <PageHeader title="概览" />, handle: h({ crumb: '概览' }) },
      { path: '*', element: <NotFoundPage />, handle: h({ crumb: '页面不存在' }) },
    ],
  },
];
