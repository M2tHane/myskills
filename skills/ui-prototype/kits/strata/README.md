# Strata

白灰为体、蓝色只落在关键处的后台界面风格。React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui 写法（Radix + cva），图标 lucide-react，路由 React Router 7，数据 TanStack Query，表单 react-hook-form + zod。

ui-prototype 的一套 UI 套件：做原型时 agent 读 [KIT.md](KIT.md)，照它在项目的 `docs/prototype/` 里搭工程、写页面。本文件写给维护 Strata 的人。

想看效果：浏览器打开 `prototypes/app.html`（全部页面样板，可点击；登录演示密码 `strata`）和 `prototypes/gallery.html`（组件总览）。

## 文件夹里有什么

| 路径 | 内容 |
|---|---|
| `KIT.md` | 套件入口：技术栈与版本、怎么搭原型工程、怎么写页面、命令 |
| `DESIGN.md` | 设计规范：原则、12 条用户偏好、token、组件选型、页面样板表、文案、新组件配方、禁止清单、技术选型、图表、项目结构与路由、表单写法 |
| `theme.css` + `fonts/` | 全部 token 与字体（Geist，许可证 `fonts/OFL.txt` 要随字体一起保留） |
| `starter/` | 原型工程骨架：依赖与版本、Vite 与 TypeScript 配置、入口、起步路由与导航 |
| `src/components/ui/` | 约 47 个组件，含对话类（对话消息、输入框、提问与执行确认）和文件树 |
| `src/components/optional/` | 可选组件（可拖动分栏、ECharts 图表），需要额外的库，用到才复制 |
| `src/lib/utils.ts` | `cn()` |
| `src/app/` | 应用骨架：路由表、外框、导航、Provider、离开确认、原型专用的状态切换条 |
| `src/pages/` | 页面样板：列表、表单、详情、概览、设置、向导、登录、对话（Agent）、403 / 404、读取失败 |
| `src/api/` + `src/mocks/` | 接口层样板与演示数据（只有 api 能引用 mocks）；`delay()` 支持 `?state=` 切换四种状态；`session.ts` + `users.ts` 是当前用户与演示账号，支持 `?as=` 切换身份；`errors.ts` 是接口报错 `ApiError`；`members.ts` 是按角色控制权限的样板；`mocks/gen.ts` 是固定种子的假数据生成器 |
| `prototypes/` | 样板的单文件 HTML 成品 |
| `scripts/check.mjs` | 规范检查，不需要安装依赖 |
| `scripts/shoot.mjs` | 截图自查：按项目的 `review.json` 截每页的五种状态，生成总览页；依赖 playwright-core 和本机的 Chrome |
| `scripts/new-page.mjs` + `templates/` | 页面生成脚本与模板（列表、详情、新建 / 编辑，以及接口层、假数据），从 `src/pages/` 的样板提炼；改了样板要同步模板 |
| `dev/` | 维护工具：组件总览、重新生成 `prototypes/` |

## 维护

```bash
cd dev
npm install          # 会在本文件夹下建一个指向 dev/node_modules 的链接
npm run dev          # 全部页面样板；#/gallery 组件总览
npm run check        # 规范检查（src、starter/src、dev/demo）
npm run typecheck
npm run prototypes   # 重新生成 ../prototypes/app.html、gallery.html
```

改了组件、样板或 `starter/` 之后，照 KIT.md 在一个临时项目里搭一次原型工程，确认 `npm run typecheck`、`npm run check:ui`、`npm run build:html` 都通过。
