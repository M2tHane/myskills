# Strata 套件

白灰为体、蓝色只落在关键处的后台界面风格，适合后台、数据类产品。ui-prototype 用它在项目的 `docs/prototype/` 里搭可点击的前端原型。

下文 `<kit>` 指本文件夹的绝对路径，命令都在项目根目录执行。

## 1. 技术栈与版本

原样填进 `docs/ARCHITECTURE.md` 的「3. 前端」：

```markdown
- React 18.3.1 + TypeScript 5.8.3，构建用 Vite 6.2.6。
- 样式：Tailwind CSS 4.1.4 + Strata 主题；界面规范与 token 以 docs/prototype/DESIGN.md、theme.css 为准。
- 组件：Strata 组件（Radix 原语 + class-variance-authority + tailwind-merge），图标 lucide-react 0.488.0，日期 date-fns 4.4.0。公共组件直接复用 docs/prototype/src/components/ui/，缺的再按 DESIGN.md 第 10 节新建。
- 路由：react-router 7.18.4（不升 8.x，8.x 要求 React 19）。
- 接口数据：@tanstack/react-query 5.104.5；请求函数与 hooks 集中在 src/api/，页面只从这里取数据。
- 表单：react-hook-form 7.90.0 + zod 4.6.7 + @hookform/resolvers 5.9.2。
- 用到才装：图表 echarts 6.1.0（Strata 图表组件），可拖动分栏 react-resizable-panels 4.14.7。
- 原型：docs/prototype/（目录结构、路由与页面写法可直接沿用）。
```

## 2. 搭工程

```bash
K=<kit>
P=docs/prototype
mkdir -p $P/scripts $P/src/components $P/src/lib $P/src/api $P/src/mocks $P/src/pages/errors
cp -R $K/starter/. $P/
cp $K/DESIGN.md $K/theme.css $P/
cp -R $K/fonts $P/
cp $K/scripts/check.mjs $P/scripts/
cp -R $K/src/components/ui $P/src/components/
cp $K/src/lib/utils.ts $P/src/lib/
cp $K/src/app/app-layout.tsx $K/src/app/providers.tsx $K/src/app/unsaved-guard.tsx $P/src/app/
cp $K/src/api/query-client.ts $P/src/api/
cp $K/src/mocks/delay.ts $P/src/mocks/
cp $K/src/pages/errors/error-pages.tsx $P/src/pages/errors/
cd $P && npm ci && npm run dev
```

跑起来是带侧栏、顶栏的空白「概览」页，地址栏换成 `#/abc` 显示 404。

用到才复制的可选组件（不复制就不用装库；都不加进 `components/ui/index.ts`）：

- 图表：`npm i echarts@6.1.0`，把 `$K/src/components/optional/chart/` 复制到 `$P/src/components/chart/`，从 `@/components/chart` 导入。
- 可拖动分栏：`npm i react-resizable-panels@4.14.7`，把 `$K/src/components/optional/resizable.tsx` 复制到 `$P/src/components/ui/resizable.tsx`，从 `@/components/ui/resizable` 导入。

## 3. 写页面

1. 先读完 `DESIGN.md`：第 1 节的 12 条用户偏好优先级最高，第 14、15 节规定数据和表单的写法。
2. 每个页面按 PRD 里的类型，在 DESIGN.md 第 8 节的样板表里找到对应样板（在 `$K/src/pages/`，接口层样板在 `$K/src/api/`），照着写。样板页面和演示数据不要整份复制进原型。
3. 改骨架：
   - `src/app/routes.tsx`：每个页面一条路由，路径与 PRD 页面表的「路由」一致，每级写 `handle.crumb`。
   - `src/app/nav.tsx`：`NAV` 换成项目的导航；`useCommandGroups` 返回项目的业务对象和常用操作。
   - `src/app/app-layout.tsx`：只改工作区名、用户信息、通知数和两处搜索框的 `placeholder`。
4. 数据：每个资源一个 `src/api/<资源>.ts`（fetch 函数用 `delay(假数据)`、查询键、hooks）和一个 `src/mocks/<数据>.ts`。假数据照 PRD 页面规格的「假数据」写：条数、各状态占比、边界样例都要有。
5. 四种状态：`delay()` 已经按地址里的 `?state=` 返回加载中、空、出错、无权限。每个读数据的页面都要接上：
   - 加载中：`DataTable loading`，或和真实布局同尺寸的 `Skeleton`。
   - 空：`DataTable empty` 或 `EmptyState`（`empty` 只清空数组，单个对象照常返回）。
   - 出错、无权限：`if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />`（`src/pages/errors/error-pages.tsx`）。
   - 写法见样板 `$K/src/pages/queries/query-list-page.tsx`。
6. 表单照 DESIGN.md 第 15 节：react-hook-form + zod，字段多的新建 / 编辑做整页表单。

## 4. 命令（在 `docs/prototype/` 里）

| 命令 | 作用 |
|---|---|
| `npm run dev` | 预览，地址 `http://localhost:5173/#/<路由>` |
| `npm run typecheck` | 类型检查 |
| `npm run check:ui` | 规范检查：写死的颜色、默认字号阴影、页面直接引用假数据等 |
| `npm run build:html` | 打包成单文件 `app.html` |
| `rm -rf node_modules` | 交付前删除依赖 |

`typecheck` 和 `check:ui` 都通过才算完成。报错按提示改成 token，不要绕过。

## 5. 维护本套件

不是做项目时用的。`dev/` 是组件总览和成品原型的构建工具，见 [README.md](README.md)。
