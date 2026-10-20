import './index.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';

// 原型用 hash 路由：打包成 app.html 后双击就能打开，各页面的跳转页也靠它定位到页面。
const router = createHashRouter(routes);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>,
);
