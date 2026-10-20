import './app.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';
import { StateBar } from '@/app/state-bar';
import { Gallery } from './gallery';

// 维护用预览：hash 路由，单文件原型双击即可打开。真实项目用 createBrowserRouter(routes)。
const router = createHashRouter([...routes, { path: '/gallery', element: <Gallery /> }]);
const only = import.meta.env.VITE_PAGE as string | undefined;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      {only === 'gallery' ? <Gallery /> : <><RouterProvider router={router} /><StateBar /></>}
    </Providers>
  </React.StrictMode>,
);
