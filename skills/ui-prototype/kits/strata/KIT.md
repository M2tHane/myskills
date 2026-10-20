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
- 当前用户：src/api/session.ts（原型里是一个演示账号），接真实登录时只改这个文件。
- 原型：docs/prototype/（目录结构、路由与页面写法可直接沿用）。
```

## 2. 搭工程

```bash
K=<kit>
P=docs/prototype
mkdir -p $P/scripts/templates $P/src/components $P/src/lib $P/src/api $P/src/mocks $P/src/pages/errors
cp -R $K/starter/. $P/
cp $K/DESIGN.md $K/theme.css $P/
cp -R $K/fonts $P/
cp $K/scripts/check.mjs $K/scripts/new-page.mjs $K/scripts/shoot.mjs $P/scripts/
cp $K/templates/* $P/scripts/templates/
cp -R $K/src/components/ui $P/src/components/
cp $K/src/lib/utils.ts $P/src/lib/
cp $K/src/app/app-layout.tsx $K/src/app/providers.tsx $K/src/app/unsaved-guard.tsx $P/src/app/
cp $K/src/api/query-client.ts $K/src/api/errors.ts $K/src/api/session.ts $P/src/api/
cp $K/src/mocks/delay.ts $K/src/mocks/users.ts $K/src/mocks/gen.ts $P/src/mocks/
cp $K/src/pages/errors/error-pages.tsx $P/src/pages/errors/
cd $P && npm ci && npm run typecheck
```

类型检查通过就算搭好了。要看页面时在后台运行 `npm run dev`（它不会自己结束，在前台运行会一直等下去）：打开是带侧栏、顶栏的空白「概览」页，地址栏换成 `#/abc` 显示 404。地址以命令打印的为准：5173 被占用时 Vite 会自动换下一个端口。

用到才复制的可选组件（不复制就不用装库；都不加进 `components/ui/index.ts`）：

- 图表：`npm i echarts@6.1.0`，把 `$K/src/components/optional/chart/` 复制到 `$P/src/components/chart/`，从 `@/components/chart` 导入。
- 可拖动分栏：`npm i react-resizable-panels@4.14.7`，把 `$K/src/components/optional/resizable.tsx` 复制到 `$P/src/components/ui/resizable.tsx`，从 `@/components/ui/resizable` 导入。

## 3. 写页面

原型只为让人看：页面画出来，按钮点得开，页面之间能跳转，列表里有数据；功能不用真的生效。

1. 先读完 `DESIGN.md`：第 1 节的 12 条用户偏好优先级最高，第 14 节规定数据的写法。
2. 每页先用脚本生成，再照 PRD 填内容：
   ```bash
   npm run new-page -- list supplier --route /suppliers --title 供应商 --nav
   npm run new-page -- detail supplier --route /suppliers/:id --title 供应商详情
   npm run new-page -- form supplier --route /suppliers/new,/suppliers/:id/edit --title 新建/编辑供应商
   ```
   - 类型：列表 `list`、详情 `detail`、新建 / 编辑 `form`。资源名用小写英文和连字符（`purchase-order`）；PRD 里一页有多个路由时，`--route` 用「,」隔开。
   - 生成的文件：页面 `src/pages/<资源>/<资源>-<类型>-page.tsx`；第一次遇到这个资源时，再生成接口层 `src/api/<资源>.ts`（只有读取）和假数据 `src/mocks/<资源>.ts`（30 条）。这两个已存在就跳过，并列出页面还缺的 hooks。路由插进 `routes.tsx`（同一资源放一组，面包屑两级）；加 `--nav` 时再插一个导航项。
   - 生成的页面已经接好四种状态、两种空状态、跳转和一个删除弹窗，要填的地方标了 `TODO(prd)`：列、筛选、字段、操作、信息分组。填完搜一遍 `TODO(prd)`，一处都不能剩。
   - 脚本不生成的页面（概览、设置、向导、登录等），以及生成的页面要加 Tabs、侧滑详情等时，去 DESIGN.md 第 8 节的样板表找对应样板（在 `$K/src/pages/`，接口层样板在 `$K/src/api/`）照着写。样板页面和演示数据不要整份复制进原型。
3. 改骨架（`src/app/app-layout.tsx` 不用改）：
   - `src/app/routes.tsx`：脚本生成的页面已经插好；手写的页面插在 `// @new-page:routes` 前面。路径与 PRD 页面表的「路由」一致，每级写 `handle.crumb`；详情页的面包屑默认显示 id。
   - `src/app/nav.tsx`：`SHELL` 写工作区名（产品名）、搜索框提示、通知数（不需要铃铛写 `null`）；`useNav` 返回项目的导航（导航项插在 `// @new-page:nav` 前面，`--nav` 插的图标统一是 `FileText`，要换成合适的）；`useCommandGroups` 返回项目的业务对象和常用操作；`useUserMenu` 返回用户菜单里的项（修改密码、退出登录等，没有就返回空数组）。
   - `src/mocks/users.ts`：只留一个演示账号，写 PRD 里权限最大的那个角色。
4. 不分角色：PRD 有多个角色时，按权限最大的角色显示全部页面、导航和按钮，不做权限判断和身份切换。
5. 数据：每个资源一个 `src/api/<资源>.ts`（读取函数用 `delay(假数据)`、查询键、hooks）和一个 `src/mocks/<资源>.ts`。列表的接口一次返回全部数据，表格自己分页。脚本生成的是通用字段（编号、名称、状态、负责人、更新时间、备注），照 PRD 改 mock 里的 `XxxRow` 和生成规则。假数据用 `src/mocks/gen.ts` 生成：二三十条，格式像样，各种状态都有，边界样例（超长名称、空值）用 `withEdges` 放进去；不需要真实，也不需要和验收标准或别的页面对得上。用法见 gen.ts 开头的例子。
6. 四种状态：`delay()` 已经按地址里的 `?state=` 返回加载中、空、出错、无权限。脚本生成的页面已经接好；手写的读数据页面照下面接：
   - 加载中：`DataTable loading`，或和真实布局同尺寸的 `Skeleton`。
   - 空：`DataTable empty` 或 `EmptyState`（`empty` 只清空数组，单个对象照常返回）。列表分两种：一条数据都没有 →「还没有…」+ 新建按钮（`?state=empty` 看的是这种）；有数据但筛选后没有结果 →「没有符合条件的…」+ 清除筛选。
   - 出错、无权限：`if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />`（`src/pages/errors/error-pages.tsx`）。
   - 详情、编辑页还要处理找不到：数据为空时显示 `NotFoundPage`。
   - 写法见样板：列表 `$K/src/pages/queries/query-list-page.tsx`，详情 `$K/src/pages/tables/table-detail-page.tsx`。
7. 按钮：打开弹窗、侧滑、下拉菜单的要能打开，内容照 PRD 画出来；跳转的（点行、新建、编辑、取消、返回）要能跳到对应页面；改数据的（保存、提交、通过、删除、弹窗里的确认）只弹一句 `toast` 提示，数据不变。
8. 表单只画字段：字段多的新建 / 编辑做整页表单，布局照 DESIGN.md 第 15 节；不做校验，「保存」弹提示后回到列表。样板 `query-form-page.tsx` 里的 react-hook-form + zod 是给真实开发看的，原型不用照抄。

## 4. 命令（在 `docs/prototype/` 里）

| 命令 | 作用 |
|---|---|
| `npm run dev` | 预览，不会自己结束，要在后台运行；地址以命令打印的为准（一般是 `http://localhost:5173/#/<路由>`） |
| `npm run new-page -- <list\|detail\|form> <资源> --route … --title … [--nav]` | 生成页面空壳（见第 3 节） |
| `npm run typecheck` | 类型检查 |
| `npm run check:ui` | 规范检查：写死的颜色、默认字号阴影、页面直接引用假数据等 |
| `npm run shoot -- <预览地址>` | 截图自查（预览要在运行）：读 `review.json`，每页截正常和四种 `?state=`（宽 1440），输出 `.shots/<页面>-<状态>.png` 和总览 `.shots/index.html`。用本机的 Chrome / Chromium，可用 `CHROME_PATH` 指定；没有浏览器时只提示、不报错 |
| `npm run build:html` | 打包成单文件 `app.html` |
| `rm -rf node_modules .shots` | 交付前删除依赖和截图 |

`typecheck` 和 `check:ui` 都通过才算完成。报错按提示改成 token，不要绕过。

## 5. 维护本套件

不是做项目时用的。`dev/` 是组件总览和成品原型的构建工具，见 [README.md](README.md)。
