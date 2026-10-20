---
name: ui-prototype
description: 在 grill-spec 之后运行：读 docs/PRD.md 与 docs/ARCHITECTURE.md，用选定的 UI 套件在 docs/prototype/ 生成可点击的前端原型（假数据、四种状态），用户验收后整理成 pi-forge 需要的输入。用户输入 /ui-prototype 时使用。
disable-model-invocation: true
argument-hint: "[对已有原型的修改意见]"
---

# ui-prototype

把 grill-spec 写好的需求变成可点击的前端原型，放在 `docs/prototype/`，交给用户验收；通过后整理成 pi-forge `/forge-build` 能直接读取的样子。分六步：检查输入 → 选套件 → 搭工程 → 写页面 → 用户验收 → 交付。

## 0. 检查输入

- 需要 `docs/PRD.md` 和 `docs/ARCHITECTURE.md`，缺一个就停下，请用户先运行 `/grill-spec`。
- 从 PRD.md 的「页面」表读出页面清单（页面、原型文件、对应需求、路由），再读每个页面的规格（类型、字段、操作、状态、假数据）和「通用约定」。
- `docs/prototype/` 里已有本 skill 生成的原型（有 `package.json` 和 `README.md`）时是**修改模式**：沿用 README.md 里写的套件，在 `docs/prototype/` 里 `npm ci`，读源码后直接进第 4 步；用户调用时附带的意见作为第一轮修改。
- `docs/prototype/` 里有别的东西（手写的原型等）时先问用户：覆盖 / 取消。

## 1. 选套件

- 套件在本 skill 目录的 `kits/<名字>/`，每套都有 `KIT.md`。只有一套就直接用；有多套时用 AskUserQuestion 让用户选，每个选项写一句这套的风格和适用场景。
- 下文 `<kit>` 指选中套件的绝对路径。先读完它的 `KIT.md`，再读 KIT.md 要求必读的文件（如设计规范）。

## 2. 搭工程

照 KIT.md「搭工程」在 `docs/prototype/` 里搭好，确认预览能打开。

## 3. 写页面

- 照 KIT.md「写页面」逐页实现 PRD 页面表里的每一页：路由与「路由」列一致，结构、字段、操作照页面规格，假数据照「假数据」要求。
- 每个读数据的页面都要能显示四种状态：加载中、空数据、出错、无权限，切换方式写在 KIT.md 里（地址加 `?state=`）。
- PRD 有多个角色时，照 KIT.md 给每个角色一个演示账号，导航、按钮、数据都按当前角色显示；地址加 `?as=<账号>` 能直接以这个角色打开页面。
- 假数据前后矛盾（如页面规格要求的数据算出来和某条 AC 里的数字对不上）时，按页面规格做，第 5 步汇报时列出。
- PRD 没写清、又必须定下来的界面细节（如某个字段用下拉还是单选），按套件规范选一个，记下来，第 5 步汇报时列出。
- 套件的类型检查和规范检查都通过，才进入下一步。

## 4. 填写前端技术栈

把 `docs/ARCHITECTURE.md` 的「3. 前端」整节内容换成 KIT.md「技术栈与版本」里的那一段（grill-spec 在那里留的是「由 ui-prototype 负责」）。其他节里如果还有交给 ui-prototype 的占位（如「前端的测试与检查由 ui-prototype 填写」），删掉那一行，前端的检查已经写在第 3 节；其余内容不动。

## 5. 用户验收

- 在后台启动预览（地址以命令打印的为准），给用户一张表：每个页面一行，列出页面名、预览地址、四种状态的地址；页面需要特定角色才能看时，地址里带上 `?as=<账号>`。再附上这一轮自己定下的界面细节，以及发现的 PRD 前后矛盾。
- 用 AskUserQuestion 问「通过，生成交付文件」还是「需要修改」（用户可以在 Other 里直接写意见）。
- 修改意见分两种：
  - **只动界面**（布局、文案、交互、假数据）：直接改原型。
  - **动了需求**（增删功能、改规则、改字段、增删页面）：原型和 `docs/PRD.md`、`docs/PRD-HUMAN.md` 一起改。PRD.md 保持 pi-forge 格式：需求标题带 `REQ-xxx`，验收标准每条一行 `- ACn Given … When … Then …`，页面表四列 `页面 | 原型文件 | 对应需求 | 路由`。已有编号不重排；新需求用下一个编号；删掉的需求整节删掉，并从页面表里去掉。改完列出改了哪些需求、验收标准和页面。
- 改完重新跑检查，再请用户看，直到用户选「通过」。

## 6. 交付

1. 套件的类型检查、规范检查通过；按 KIT.md 打包出 `docs/prototype/app.html`。
2. 为页面表的每一行写一个跳转页，路径就是「原型文件」列，内容照下面的模板。
   - 路由带参数（如 `/queries/:id/edit`）时，用假数据里一个真实的编号。
   - 「路由」一格写了多个（用「、」隔开）时，跳到第一个，其余写在「其他路由」一行。
   - 页面需要特定角色才能看时，跳转地址带上 `?as=<账号>`，并写「演示身份」一行。
3. 删掉 `docs/prototype/node_modules/` 和打包的中间目录。pi-forge 读取原型目录时不看 `.gitignore`，超过 500 个文件或 30 MB 会直接报错。
4. 在项目根目录运行 `node <本 skill 目录>/scripts/check-export.mjs`，全部通过才算完成；不通过就按提示改，再跑一次。
5. 汇报，不超过 6 行：页面数、原型目录的文件数和大小、自己定下的界面细节、PRD 的改动（没有就不写），以及下一步：在 pi-forge 里运行 `/forge-build`。

跳转页模板（`{…}` 换成实际内容，源码路径相对 `docs/prototype/`；「其他路由」「演示身份」两行没有就删掉）：

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>{页面名} · 原型</title></head>
<body>
<!--
  原型页面：{页面名}（{对应需求}）
  可点击：app.html#{路由}；四种状态在后面加 ?state=loading / empty / error / forbidden（已有 ? 时用 &state=）
  源码：{页面源码路径}
  其他路由：{如 /queries/:id/edit → app.html#/queries/12/edit}
  演示身份：{账号}（{角色}），其他身份把 ?as= 换成别的账号
-->
<script>location.replace('app.html#{路由}');</script>
</body>
</html>
```

## 新增套件

在 `kits/<名字>/` 下放这套 UI 的规范、样式、组件，再写一个 `KIT.md`，至少包含这几节（可以参照 `kits/strata/KIT.md`）：

1. **技术栈与版本**：一段能原样填进 ARCHITECTURE.md「3. 前端」的文字，包括前端的检查命令。
2. **搭工程**：在 `docs/prototype/` 里搭起能预览的工程的步骤。`DESIGN.md`（组件与用法）和 `theme.css`（设计 token）必须放在 `docs/prototype/` 根目录，pi-forge 开始前会检查。
3. **写页面**：页面样板在哪、数据和假数据怎么放、四种状态怎么用 `?state=` 切换、多个角色怎么用 `?as=<账号>` 切换（跳转页依赖这两个地址参数）。
4. **命令**：预览、类型检查、规范检查、打包成单文件 `app.html`（hash 路由，双击可开）、删除依赖。
