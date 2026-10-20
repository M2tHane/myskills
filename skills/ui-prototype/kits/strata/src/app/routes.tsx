import { Navigate, type RouteObject } from 'react-router';
import { AppLayout, type RouteHandle } from './app-layout';
import { OverviewPage } from '@/pages/overview/overview-page';
import { QueryListPage } from '@/pages/queries/query-list-page';
import { QueryFormPage } from '@/pages/queries/query-form-page';
import { TableDetailPage } from '@/pages/tables/table-detail-page';
import { SourceListPage } from '@/pages/sources/source-list-page';
import { SourceWizardPage } from '@/pages/sources/source-wizard-page';
import { SettingsPage } from '@/pages/settings/settings-page';
import { MemberListPage } from '@/pages/members/member-list-page';
import { LoginPage } from '@/pages/auth/login-page';
import { NotFoundPage, RouteErrorPage } from '@/pages/errors/error-pages';

const h = (handle: RouteHandle) => handle;

/**
 * 全部路由。项目入口用 createBrowserRouter(routes)；需要双击打开的单文件原型用 createHashRouter(routes)。
 * 规则：每个页面一个路由；列表 /xxx，详情 /xxx/:id，新建 /xxx/new，编辑 /xxx/:id/edit。
 * 外框（AppLayout）是布局路由；登录页在它之外。找不到的路径：外框内显示 404，外框外显示整页 404。
 */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <OverviewPage />, handle: h({ crumb: '概览' }) },
      {
        path: 'queries', handle: h({ crumb: '查询' }),
        children: [
          { index: true, element: <QueryListPage /> },
          { path: 'new', element: <QueryFormPage />, handle: h({ crumb: '新建查询' }) },
          { path: ':id/edit', element: <QueryFormPage />, handle: h({ crumb: '编辑' }) },
        ],
      },
      {
        path: 'data', handle: h({ crumb: '数据资产' }),
        children: [
          { index: true, element: <Navigate to="tables" replace /> },
          {
            path: 'sources', handle: h({ crumb: '数据源' }),
            children: [
              { index: true, element: <SourceListPage /> },
              { path: 'new', element: <SourceWizardPage />, handle: h({ crumb: '新建数据源' }) },
            ],
          },
          {
            path: 'tables', handle: h({ crumb: '数据表' }),
            children: [
              { index: true, element: <Navigate to="orders_daily" replace /> },
              { path: ':name', element: <TableDetailPage />, handle: h({ crumb: (m) => m.params.name ?? '' }) },
            ],
          },
        ],
      },
      { path: 'members', element: <MemberListPage />, handle: h({ crumb: '成员与权限' }) },
      { path: 'settings', handle: h({ crumb: '设置' }), children: [
        { index: true, element: <Navigate to="general" replace /> },
        { path: ':section', element: <SettingsPage /> },
      ] },
      { path: '*', element: <NotFoundPage />, handle: h({ crumb: '页面不存在' }) },
    ],
  },
];
