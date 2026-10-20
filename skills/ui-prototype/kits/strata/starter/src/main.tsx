import './index.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';
import { StateBar } from '@/app/state-bar';

// 原型用 hash 路由：打包成 app.html 后双击就能打开，各页面的跳转页也靠它定位到页面。
const router = createHashRouter(routes);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
      {/* 原型专用：顶栏正中的四种状态切换，正式产品删掉 */}
      <StateBar />
    </Providers>
  </React.StrictMode>,
);
