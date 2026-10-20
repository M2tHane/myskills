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
- 检查：TypeScript 类型检查（tsc --noEmit）与 Strata 规范检查（node scripts/check.mjs src，拦写死的颜色、默认字号阴影、页面直接引用假数据）；前端单元测试与浏览器测试的框架由架构师定。
- 当前用户：src/api/session.ts（原型里是演示账号与 ?as= 切换），接真实登录时只改这个文件。
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
cp $K/src/api/query-client.ts $K/src/api/errors.ts $K/src/api/session.ts $P/src/api/
cp $K/src/mocks/delay.ts $K/src/mocks/users.ts $P/src/mocks/
cp $K/src/pages/errors/error-pages.tsx $P/src/pages/errors/
cd $P && npm ci && npm run typecheck
```

类型检查通过就算搭好了。要看页面时在后台运行 `npm run dev`（它不会自己结束，在前台运行会一直等下去）：打开是带侧栏、顶栏的空白「概览」页，地址栏换成 `#/abc` 显示 404。地址以命令打印的为准：5173 被占用时 Vite 会自动换下一个端口。

用到才复制的可选组件（不复制就不用装库；都不加进 `components/ui/index.ts`）：

- 图表：`npm i echarts@6.1.0`，把 `$K/src/components/optional/chart/` 复制到 `$P/src/components/chart/`，从 `@/components/chart` 导入。
- 可拖动分栏：`npm i react-resizable-panels@4.14.7`，把 `$K/src/components/optional/resizable.tsx` 复制到 `$P/src/components/ui/resizable.tsx`，从 `@/components/ui/resizable` 导入。

## 3. 写页面

1. 先读完 `DESIGN.md`：第 1 节的 12 条用户偏好优先级最高，第 14、15 节规定数据和表单的写法。
2. 每个页面按 PRD 里的类型，在 DESIGN.md 第 8 节的样板表里找到对应样板（在 `$K/src/pages/`，接口层样板在 `$K/src/api/`），照着写。样板页面和演示数据不要整份复制进原型。
3. 改骨架（`src/app/app-layout.tsx` 不用改）：
   - `src/app/routes.tsx`：每个页面一条路由，路径与 PRD 页面表的「路由」一致，每级写 `handle.crumb`。
   - `src/app/nav.tsx`：`SHELL` 写工作区名（产品名）、搜索框提示、通知数（不需要铃铛写 `null`）；`useNav` 返回项目的导航；`useCommandGroups` 返回项目的业务对象和常用操作；`useUserMenu` 返回用户菜单里的项（修改密码、退出登录等，没有就返回空数组）。
   - `src/mocks/users.ts`：演示账号，见下一条。
4. 角色：PRD 有多个角色时，`src/mocks/users.ts` 里每个角色放一个演示账号（需要部门、多个角色等字段就加在 `DemoUser` 上）。
   - 权限规则写在资源的 api 文件里，一条规则一个函数（如 `canManageMembers(user)`），三处都用它：api 里用 `getCurrentUser()` 判断，没权限返回 `fail('…', 300, 403)`，页面照常用 `LoadFailed` 显示无权限；`useNav` 里过滤掉没权限的入口；页面里用 `useCurrentUser()` 决定按钮显示与否。
   - 写法见样板：`$K/src/api/members.ts`、`$K/src/pages/members/member-list-page.tsx`、`$K/src/app/nav.tsx` 的 `useNav`（管理员能看成员列表；数据分析看不到入口，直接打开显示无权限）。
   - 侧栏底部的用户菜单可以切换演示身份；地址加 `?as=<账号 id>` 直接以这个身份打开（如 `#/suppliers?as=chenjing`），切换后数据会重新请求。
   - 只有一个角色时保留一个演示账号即可，菜单里不会出现切换。
5. 数据：每个资源一个 `src/api/<资源>.ts`（fetch 函数用 `delay(假数据)`、查询键、hooks）和一个 `src/mocks/<数据>.ts`。假数据照 PRD 页面规格的「假数据」写：条数、各状态占比、边界样例都要有。
6. 四种状态：`delay()` 已经按地址里的 `?state=` 返回加载中、空、出错、无权限。每个读数据的页面都要接上：
   - 加载中：`DataTable loading`，或和真实布局同尺寸的 `Skeleton`。
   - 空：`DataTable empty` 或 `EmptyState`（`empty` 只清空数组，单个对象照常返回）。列表分两种：一条数据都没有 →「还没有…」+ 新建按钮（`?state=empty` 看的是这种）；有数据但筛选后没有结果 →「没有符合条件的…」+ 清除筛选。
   - 出错、无权限：`if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />`（`src/pages/errors/error-pages.tsx`）。
   - 详情、编辑页还要处理找不到：数据为空时显示 `NotFoundPage`。
   - 写法见样板：列表 `$K/src/pages/queries/query-list-page.tsx`，详情 `$K/src/pages/tables/table-detail-page.tsx`。
7. 表单照 DESIGN.md 第 15 节：react-hook-form + zod，字段多的新建 / 编辑做整页表单。

## 4. 命令（在 `docs/prototype/` 里）

| 命令 | 作用 |
|---|---|
| `npm run dev` | 预览，不会自己结束，要在后台运行；地址以命令打印的为准（一般是 `http://localhost:5173/#/<路由>`） |
| `npm run typecheck` | 类型检查 |
| `npm run check:ui` | 规范检查：写死的颜色、默认字号阴影、页面直接引用假数据等 |
| `npm run build:html` | 打包成单文件 `app.html` |
| `rm -rf node_modules` | 交付前删除依赖 |

`typecheck` 和 `check:ui` 都通过才算完成。报错按提示改成 token，不要绕过。

## 5. 维护本套件

不是做项目时用的。`dev/` 是组件总览和成品原型的构建工具，见 [README.md](README.md)。
