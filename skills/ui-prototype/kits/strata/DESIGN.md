# Strata 设计规范

Strata 是一套给后台、数据类产品用的界面风格：**白与灰是主体，蓝色只落在关键处**。层次靠画布、表面、边框、阴影四件事拉开，而不是靠大块色彩分区。

本文件写给人，也写给 agent。agent 动手前读完它；做页面时先用现成组件，现成组件不够时按「新组件配方」自己做。

- 技术栈：React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui 写法（Radix 原语 + cva + `cn()`），图标 lucide-react。
- token 唯一来源：`theme.css`。组件源码：`src/components/ui/`。目录结构、路由、数据与表单的写法见第 14、15 节。
- 每次改完在前端目录里运行规范检查 `node scripts/check.mjs src` 和类型检查（原型里是 `npm run typecheck`）。
- 不用 `npx shadcn add` 拉官方组件：官方组件用的是 Tailwind 默认字号和阴影（`text-sm`、`shadow-xs`），在这里会失效。缺组件时按第 10 节自己做。

---

## 1. 总原则

1. **白灰为体，蓝色点睛。** 页面上大面积只有三种颜色：灰画布、白表面、灰边框。蓝色只给：每屏唯一的主按钮、当前导航项、选中态、链接、焦点环、图表里的当前值。
2. **层次来自材质，不来自色块。** 不做蓝色顶栏、蓝色侧栏、蓝色大标题条。要强调一块区域，用白卡片放在灰画布上，再加一层边框和轻阴影。
3. **商务、克制、密度适中。** 控件 32px，表格行 40px。不要大面积留白，不要“空荡荡的一张卡片中间放一行字”。
4. **不写灰色说明文字。** 表单项下不加提示语，标题下不加副标题解释，卡片里不写“这里显示……”。需要解释的东西，放进 Tooltip、文档或空状态里。
5. **秩序优先。** 对齐到 4px 网格；同一行控件同高；数字列右对齐并用等宽数字；同类东西在同一位置出现。

### 用户偏好（12 条，硬性）

以下是用户在逐组验收时定下的偏好，优先级高于本文其他建议。

1. **整体风格**：商务、简约、有设计感。不要“AI 味”——组件过于简单、大面积留白、按钮 / 表格 / 图表缺少设计和易读性，都不行。
2. **配色与层次**：白和灰是主体，蓝色只用在关键处；拒绝简单的蓝白分区；靠层次、材质、空间感和视觉秩序拉开区域。
3. **不放灰色解释性小字**：按钮旁的风险说明、页面顶部的范围说明、表单提示语、标题副标题、卡片描述，一律不要。
4. **分页**：表格底部有上一页、页码、下一页、跳转；表格底部到页面底部的距离要合适，分页条紧贴表格。
5. **每页条数与页码**：页大小只有 10 / 20 / 50 / 100（默认 10）；页码按钮位置固定，不随中间页码位数变化而错位。
6. **下拉搜索**：下拉选项超过 8 个，带搜索框。
7. **子模块拆分**：一个模块拆成多个子模块时，不把两个子模块挤在同一页，用 Tabs 或二级竖向导航分开。
8. **徽标只有一种样式**：浅底 + 同色描边 + 12px 图标，图标随状态固定；“运行中”用进度弧图标。
9. **表格**：人员列不放头像；选中行不加背景色；鼠标悬停时整行高亮，而不是只高亮一个单元格；名称列不能占满剩余宽度把其他列挤窄，宽度按列等比分配。
10. **提示框**：深色 Tooltip 只用于简短提示；列表类内容（如多选的 +N）用浅色、竖向排列、显示在鼠标下方。
11. **详情字段**：字段名和值要一眼分开；字段多时用带边框的样式（标签格浅灰底），字段少时用简洁样式（标签灰、值加粗）。
12. **弹窗与提示**：确认类弹窗用小尺寸（400px），不要过宽；toast 和页内提示高度一致（64px 两行）；页内提示都可以关闭。

协作约定：回答技术问题先给结论再讲原因，默认中文；只用 React，不考虑 Vue。

---

## 2. 颜色

只用语义 token。原始色阶（`--gray-*`、`--blue-*`）只允许在 `src/components/ui/` 内部用 `bg-(--gray-300)` 这种写法引用，页面代码里不出现。Tailwind 默认色板（`bg-blue-500`、`text-gray-600`）已被移除，写了也不会生效，规范检查会报错。

| 用途 | 类名 | 说明 |
|---|---|---|
| 页面画布 L0 | `bg-canvas` | 应用内容区背景，gray-50 |
| 表面 L1 | `bg-surface` | 卡片、表格、侧栏、顶栏，白色 |
| 下沉区 | `bg-surface-sunken` | 表头、代码块、指标井、标签格 |
| 浮层 L2/L3 | `bg-surface-raised` | 下拉、气泡、弹窗 |
| 悬停 / 按下 | `bg-surface-hover` / `bg-surface-active` | 白表面上的可点击行和项 |
| 选中 | `bg-surface-selected` | 当前导航项、选中卡片（浅蓝） |
| 分隔线 | `border-border-subtle` | 表面内部、表格行线 |
| 轮廓 | `border-border` | 卡片、面板、浮层外框 |
| 控件边框 | `border-border-strong` | 按钮、输入框 |
| 主文字 | `text-fg` | gray-900 |
| 次要文字 | `text-fg-muted` | 表头、标签名 |
| 辅助文字 | `text-fg-subtle` | 时间戳、单位、计数（不是说明文字） |
| 禁用 | `text-fg-disabled` | 不承载信息 |
| 主色 | `bg-primary` `text-primary` | 石板蓝 #2E5BBA，见下方限制 |
| 主色浅底 / 浅边 | `bg-primary-soft` `border-primary-line` | 蓝色徽标、选中卡片 |
| 链接 | `text-link` | |
| 状态 | `success` `warning` `danger` `info` 各带 `-soft`（底）与 `-line`（边） | 只用于状态，不当装饰色 |
| 遮罩 | `bg-scrim`（弹窗） / `bg-scrim-soft`（侧滑面板） | |

**蓝色使用限额**

- 每个视图**只有一个** `variant="default"`（实心蓝）按钮，其余用 `outline`、`ghost`。
- 当前导航项、当前 Tab 下划线、选中态、焦点环可以是蓝色。
- 图表：历史数据灰色（gray-300），当前或高亮值蓝色。不做彩虹色图表；需要多系列时依次用 `chart-1`…`chart-5`（蓝、浅蓝、灰）。
- 不要蓝色背景的大区块、蓝色标题栏、蓝色侧边栏。

---

## 3. 层级与材质

| 层 | 用在 | 写法 |
|---|---|---|
| L0 画布 | 内容区背景 | `bg-canvas` |
| −1 下沉 | 表面内部的井、表头、标签格 | `bg-surface-sunken`，可加 `shadow-inset` |
| L1 表面 | 卡片、表格容器、面板 | `bg-surface border border-border rounded-md shadow-card` |
| L2 浮起 | 下拉、Popover、Tooltip（浅色） | `bg-surface-raised border border-border rounded-md shadow-raised` |
| L3 覆盖 | 弹窗、侧滑面板 | `rounded-lg shadow-overlay` + 遮罩 |

- 材质 = 边框 + 阴影 + 顶部高光一起出现。白色控件用 `shadow-control`（外投影 + 底部内阴影），主按钮用 `shadow-primary`（顶部高光 + 底部暗边 + 蓝调投影），按下用 `shadow-press-primary` / `shadow-inset`。
- 卡片不要只有阴影没有边框，也不要只有边框没有阴影。
- 不嵌套超过两层卡片。卡片里再分区用 `border-border-subtle` 分隔线或 `bg-surface-sunken` 下沉区。
- 焦点：键盘焦点统一 `shadow-focus-ring`（2px 白隙 + 2px 蓝环）；输入框聚焦是 ring 色 1px 边框 + `shadow-focus-input` 外晕。不用 `outline`。

---

## 4. 字体与字号

- 字体：Geist + 苹方 / 微软雅黑；代码、ID、表名、SQL 用 Geist Mono（`font-mono`）。
- 数字列、金额、时间用 `tabular-nums`。
- Tailwind 默认字号（`text-sm`、`text-lg`）已移除。只用下表：

| 类名 | 字号 / 行高 | 用在 |
|---|---|---|
| `text-badge` | 10 / 12 | 计数角标、键帽 |
| `text-micro` | 11 / 16 | 侧栏分组名、极小标签 |
| `text-caption` | 12 / 16 | 徽标、表头、小按钮、时间戳 |
| `text-body-sm` | 13 / 20 | **默认正文**、表格、按钮、输入框 |
| `text-body` | 14 / 22 | 大按钮、需要更舒展的段落 |
| `text-code` | 12.5 / 20 | 等宽文本（配 `font-mono`） |
| `text-title-3` | 15 / 22 | 卡片标题 |
| `text-heading` | 16 / 24 | 弹窗、侧滑面板标题 |
| `text-title-2` | 18 / 26 | 区块标题 |
| `text-title-1` | 22 / 30 | 页面标题 |
| `text-num-lg` | 26 / 32 | 指标卡数值 |
| `text-display` | 28 / 36 | 极少使用的展示数字 |

- 字重只用 400 / 500 / 600。标题 600，标签名、按钮 500。
- 需要新字号时，先加进 `theme.css` 的 `@theme inline` 与 `src/lib/utils.ts` 的 `text` 列表，不写 `text-[13px]`。

---

## 5. 尺寸、间距、圆角

- 密度：紧凑。控件 `h-(--control-md)` 32px（sm 28 / lg 36）；表格行 40px（紧凑 36）；顶栏 52px；侧栏 232px（收起 60px）。
- 间距按 4px 网格：控件内 8–12，卡片内边距 16，卡片之间 16，页面左右 24。`PageBody` 已固定为 `px-6 pt-4 pb-6 gap-4`。
- 圆角只有五档，不用 `rounded-xl` 及以上：

| 类名 | 值 | 用在 |
|---|---|---|
| `rounded-xs` | 4 | 复选框、徽标、键帽 |
| `rounded-sm` | 6 | 按钮、输入框、下拉项 |
| `rounded-md` | 8 | 卡片、下拉菜单、Popover |
| `rounded-lg` | 12 | 弹窗、侧滑面板 |
| `rounded-full` | — | 开关、头像、圆点、计数 |

- 阴影只用 token：`shadow-xs / control / card / raised / overlay / inset / primary / danger / focus-ring …`，不写 Tailwind 的 `shadow-lg`。

---

## 6. 状态

- 悬停：白表面 → `surface-hover`；控件边框加深到 gray-400。
- 按下：`surface-active` + `shadow-inset`；主按钮 `primary-active` + `shadow-press-primary`。
- 禁用：降低对比，不降透明度整块变灰；光标 `not-allowed`。
- 加载：按钮用 `loading` 属性（转圈替换左图标，文字保留）；表格用 `loading`（骨架行）；整页用 `Skeleton`，不用全屏转圈。
- 错误：输入框 `invalid` + `Field error`，红字只写错误本身，不写建议。
- 空：`EmptyState`，标题一句话 + 一个操作按钮。列表分两种：没有数据（「还没有查询」+ 新建查询）；筛选后没有结果（「没有符合条件的查询」+ 清除筛选）。

---

## 7. 组件目录与选型

导入：`import { Button, DataTable } from '@/components/ui';`

### 操作
| 组件 | 什么时候用 |
|---|---|
| `Button` | `default` 每视图唯一主操作；`outline` 日常按钮（默认）；`secondary` 工具栏里的弱操作；`ghost` 行内、图标旁；`link` 文字链接；`destructive` 确认删除弹窗里的主按钮；`destructive-outline` 页面上的删除入口。尺寸 sm / md / lg、`icon-*`。文字动词开头：“新建查询”“导出”“删除”。 |
| `IconButton` | 只有图标的按钮。`label` 必填，默认带 Tooltip。 |
| `ButtonGroup` | 刷新 + 更多、主按钮 + 下拉（split）。`attached` 连体，`attached={false}` 间隔。 |
| `SegmentedControl` | 2–5 个互斥视图或时间范围切换（7 天 / 30 天）。不用于表单取值。 |
| `DropdownMenu` | “更多”菜单。`DropdownMenuItem icon shortcut danger`，危险项放最后并用分隔线隔开。 |

### 信息展示
| 组件 | 什么时候用 |
|---|---|
| `Badge` | **只有一种样式**：浅底 + 同色边 + 12px 图标。图标随 tone 固定：neutral 时钟、primary 进度弧（运行中）、success 对勾、warning 三角、danger 叉。纯标签（类型、计数）用 `icon={false}`。不要自定义颜色。 |
| `CountBadge` | 导航、Tab、铃铛上的数量。 |
| `Tooltip` | 默认深色；内容是列表（如多选 +N 展开）时用 `appearance="light"`，从下方弹出。 |
| `Kbd` / `KbdCombo` | 快捷键。 |
| `Avatar` | 只在用户菜单、评论、成员管理里用；表格人员列不用。 |
| `DescriptionList` | 详情字段。字段多（≥6）用 `bordered`（标签格浅灰底）；字段少用默认（标签灰、值 500 字重）。标签在左，值在右。 |
| `StatCard` | 指标：标签、数值、同比、迷你趋势图（历史灰、当前蓝）。一行 3–4 个。`deltaGood` 决定涨跌着色。 |
| `BarChart` | 单系列柱状图。历史灰、最后一根（或 `highlight`）蓝。 |
| `Progress` / `Steps` | 进度条；流程步骤只用圆点样式。 |
| `List` / `ListItem` | 卡片里的简短列表（最近运行、关联对象）。 |
| `EmptyState` | 空数据、无权限、无结果。 |
| `Skeleton` / `Spinner` | 加载。 |

### 表单
| 组件 | 什么时候用 |
|---|---|
| `Field` | 包住每个控件：`label` `required` `error`；横排表单用 `orientation="horizontal"`。没有 hint 属性——不写提示语。 |
| `FormSection` | 整页表单分组：标题 + 1–2 列栅格（`columns`），字段用 `span={2}` 占满一行。 |
| `ActionBar` | 整页表单、向导底部的操作条，吸附在内容区底部。`start` 放左侧（删除、上一步），children 放右侧（取消 + 主操作）。页面根节点要是 `flex min-h-full flex-col`。弹窗里用 `DialogFooter`，不用它。 |
| `Input` | `leftIcon` `suffix` `addonBefore/After` `clearable` `invalid`；`type="password"` 自带显示切换。可受控（`value`），也可直接 `{...register('name')}`。 |
| `Textarea` | `showCount` 字数在右下，拉伸手柄在字数下方；SQL 等用 `mono`。同样支持 `register`。 |
| `DatePicker` / `DateRangePicker` / `Calendar` | 日期、日期范围。周一开始，固定 6 行。`min` `max` 限制可选范围，`clearable`。范围选择的两个月各自翻页、互不带动（左边始终早于右边）；左侧是快捷项（今天、昨天、近 7 / 30 / 90 天、本月、上月），选中快捷项时触发器显示快捷项名称；表单里的生效期间这类不需要快捷项时传 `presets={false}`。列表工具栏的时间筛选也用它。 |
| `Select` | 单选下拉。超过 8 项自动出现搜索框；支持分组、`meta`。在页面底部时用 `placement="top"`。 |
| `MultiSelect` | 多选，标签放不下时显示 +N，悬停 +N 用浅色 Tooltip 竖排列出；底部有“全选 / 清空”。 |
| `Checkbox` / `RadioGroup` / `Switch` | 复选、单选（`variant="card"` 做方案选择）、即时生效的开关。需要点“保存”才生效的布尔值用 Checkbox，不用 Switch。 |

### 数据
| 组件 | 什么时候用 |
|---|---|
| `DataTable` | 列表页主体。`columns`（`width` 是基准宽度：表格更宽时各列等比放大，更窄时不写 width 的列先压到 160 再横向滚动；`minWidth` 允许压缩；`numeric` 右对齐等宽；`sortable`；`render`）。名称列可以不写 width（按 240 计）。悬停整行高亮。`selectable` + `bulkActions`、`rowActions`（悬停出现）、`onRowClick` + `activeRowKey`（打开侧滑详情）、`toolbar`、`loading`、`empty`、`density`。分页内置。 |
| `Pagination` | 表格外单独分页时用。`full` / `simple`，页大小固定 10/20/50/100。 |
| `Tree` | 层级数据：目录、库表、组织架构。行高 32，每级缩进 16 并有引导线，`meta` 放右侧计数。`checkable` 时只记录叶子节点（`checked` / `onCheckedChange`），父节点显示全选 / 半选；`defaultExpanded="all"` 全部展开；`filter` 传关键词即可过滤并高亮，自动展开命中路径。 |
| `Dropzone` / `UploadList` | 上传。`Dropzone` 是虚线拖放区（`accept` `multiple` `maxSize`，`size="sm"` 用在表单里），`onFiles(accepted, rejected)` 把不符合要求的文件单独返回；`UploadList` 每个文件一行：图标、名称、大小、进度条或状态，失败显示原因，`retryable` 的才出现「重试」。上传进度和请求放在 `src/api/`。 |

### 布局与导航
| 组件 | 什么时候用 |
|---|---|
| `AppShell` | 应用外框。默认 `classic`：白色侧栏（右边框）+ 白色顶栏 + 灰画布内容区。`inset` 为备选。 |
| `Sidebar` / `WorkspaceSwitch` / `SidebarUser` / `Mark` | 一级导航，可分组、可嵌套一层、带计数、可收起到 60px。头部用 `WorkspaceSwitch`，底部用 `SidebarUser`（当前用户，点开是用户菜单）：收起时只剩图标和头像，名字进 Tooltip。自定义头部 / 底部时用 `useSidebar()` 读收起状态，不要让文字在 60px 里折行。 |
| `Topbar` / `SearchTrigger` | 顶栏：左侧面包屑，右侧搜索、通知、帮助。`SearchTrigger` 点击或 ⌘K / Ctrl K 打开 `CommandPalette`。 |
| `CommandPalette` / `useCommandShortcut` | 全局搜索与跳转：分组（页面、查询、数据表、操作），键盘上下选择、回车执行，关键词高亮，每组最多显示 `limit` 条。在 `app-layout.tsx` 里挂一次；「页面」组由导航自动生成，其余分组写在 `nav.tsx` 的 `useCommandGroups()`，数据从 `src/api/` 取。 |
| `Breadcrumb` | **只放在顶栏**，显示完整路径（运营数据中心 › 数据资产 › 数据表 › orders_daily）。 |
| `PageHeader` | 页面标题 + 状态徽标 + 操作区 + Tabs。在 AppShell 里**不传 breadcrumb**。 |
| `PageBody` | 页面内容区，统一边距与间距。 |
| `Tabs` | 页面内子模块（≤6 个）。`TabsTrigger count` 显示数量。 |
| `VerticalNav` | 子模块多于 6 个，或设置类页面：左侧二级导航，右侧内容区。 |
| `ResizableGroup` / `ResizablePanel` / `ResizableHandle` | **可选组件**（`src/components/optional/resizable.tsx`，需装 `react-resizable-panels@4.14.7`）。编辑器 + 结果、对话 + 结果、目录树 + 详情这类要让用户调宽高的分栏。`variant="line"`：同一张卡片里的面板，1px 细线分隔；`variant="gap"`：两张卡片之间 8px 间隙，分隔线平时隐藏。悬停、拖动、键盘聚焦时分隔线变 ring 色。`orientation="vertical"` 上下分栏，可嵌套；`storageKey` 记住用户拖出的尺寸。面板尺寸：数字是 px，不带单位的字符串是百分比。外框不用它。 |
| `Card` | 内容分块。`title` `extra`（右上操作）`footer`；表格、列表铺满时 `padding="none"`。 |

### 反馈与浮层
| 组件 | 什么时候用 |
|---|---|
| `Dialog` | 需要打断的操作。尺寸：`sm` 400（确认、单字段）、`md` 520（默认表单）、`lg` 720（复杂表单）。确认类加 `DialogHeader tone`。危险确认用 `sm` + `destructive` 按钮，写清对象名。 |
| `Sheet` | 不离开列表查看或编辑一条记录。右侧滑出，四周留 8px，轻遮罩不模糊，默认宽 480。 |
| `Popover` | 筛选面板、轻量设置。带 `title` 和底部“重置 / 应用”。 |
| `toast()` / `Toaster` | 操作结果。64px 两行（标题 + 一行描述），右下角，最多 4 条；删除类带“撤销”。 |
| `Alert` | 页面内提示，64px 两行，**都可关闭**（传 `onClose`）。`variant="banner"` 48px 用于全局通知。 |

---

## 8. 页面布局规则

- **外框固定为 classic**：`AppShell` + `Sidebar` + `Topbar`，内容区灰画布，卡片白色。参考 `src/app/app-layout.tsx`。
- **面包屑只在顶栏**，展示从工作区到当前对象的完整路径；`PageHeader` 不再重复。
- 页面结构自上而下：`PageHeader`（标题、状态、操作、Tabs）→ `PageBody`（提示条、卡片、表格）。
- 每种页面都有样板（在 Strata 套件的 `src/pages/`；原型和产品里没有这些文件时，照已经写好的同类页面写），写新页面先找最接近的一个照着写：

| 页面 | 路由 | 样板 | 要点 |
|---|---|---|---|
| 列表 | `/queries` | `pages/queries/query-list-page.tsx` | PageHeader 带 Tabs 与唯一主按钮 → DataTable（工具栏：搜索 240px、状态下拉、时间范围 `DateRangePicker`、筛选 Popover、右侧导出）→ 点行打开 Sheet → 删除用 Dialog sm + 撤销 toast |
| 简单列表 | `/data/sources` | `pages/sources/source-list-page.tsx` | 只有表格和一个主按钮时就这么简单，不硬塞工具栏 |
| 新建 / 编辑 | `/queries/new`、`/queries/:id/edit` | `pages/queries/query-form-page.tsx` | 字段超过 6 个或有联动就做整页表单，不用 Dialog；一张卡片里 FormSection 分组 → 底部 ActionBar；有改动时离开会确认 |
| 详情 | `/data/tables/:name` | `pages/tables/table-detail-page.tsx` | 见下 |
| 概览 | `/` | `pages/overview/overview-page.tsx` | 见下 |
| 设置 | `/settings/:section` | `pages/settings/settings-page.tsx` | 左侧 VerticalNav，每个分组一个路由、独占内容区；右侧横排表单卡片（标签宽 136，表单最宽 640），保存放在卡片 footer，没有改动不可点 |
| 分步向导 | `/data/sources/new` | `pages/sources/source-wizard-page.tsx` | 3–5 步；卡片顶部 Steps，底部 ActionBar（左上一步，右取消 + 下一步 / 完成）；一个表单贯穿所有步骤，每步只 `trigger` 本步字段 |
| 登录 | `/login` | `pages/auth/login-page.tsx` | 外框之外；左侧灰画布（左上角 Logo）放真实组件拼的产品预览，右侧 480px 白色表单栏；不用插画、渐变 |
| 按角色可见 | `/members` | `pages/members/member-list-page.tsx` + `api/members.ts` | 权限规则写在 api 文件（`canManageMembers`）：接口没权限返回 403，`useNav` 按它过滤入口，按钮按它显示；页面自己不判断角色 |
| 403 / 404 / 出错 | `*`、`errorElement`、读取失败 | `pages/errors/error-pages.tsx` | 在外框内只占内容区；固定结构：图标块、状态码、标题、一行事实、两个按钮 |

- 只有 ≤5 个字段的简单新建（重命名、加标签）才用 Dialog md。
- 详情页（`table-detail-page.tsx`）：PageHeader 带名称、状态徽标、收藏、刷新/更多、主操作、子模块 Tabs → 概览 Tab 用 1.6 : 1 两栏卡片，左侧主信息（bordered DescriptionList、趋势图），右侧次要信息（来源、关联列表）。
- 概览页（`overview-page.tsx`）：时间范围 SegmentedControl → 一行 4 个 StatCard → 图表卡 + 列表卡两栏 → 用量/进度卡。
- 子模块：≤6 个用 Tabs；更多或设置类用 `VerticalNav`；**不把多个子模块堆在同一页上下滚动**。
- 两栏卡片的左右高度尽量接近，短的一栏补上有用的信息卡，不留大块空白。
- 表格距页面底部保持 `PageBody` 的 24px；表格高度跟随内容，分页条紧跟表格底部。
- 页面最小宽度按 1280 设计，1440 为主要检查宽度。

---

## 9. 文案

- 中文，简短，动词开头：“新建查询”“运行”“导出 CSV”。按钮不超过 6 个字。
- 确认弹窗标题写问题本身：“删除这个查询？”，正文一句点名对象并写后果：“「华东区域订单」及其运行记录将被永久删除。”按钮写动作“删除”而不是“确定”。
- toast 标题写结果：“已删除「x」”“导出完成”。描述一行，可省略。
- 状态词固定：运行中、已完成、待审核、失败、草稿、已上线、已下线。
- 数字千分位，单位与数字间空格：“3.6 GB”“1.4 s”。时间 `2026-10-19 02:14`。
- 不写“这里是…”“您可以在此…”这类说明句；不写感叹号；不用 emoji。

---

## 10. 新组件配方

现成组件不够时，agent 按下面的步骤新建组件，放到 `src/components/ui/<name>.tsx` 并在 `index.ts` 导出。

1. **先找能组合的现成组件**：Card、List、DescriptionList、Popover、Dialog、Badge 往往组合即可，不必新建。
2. **交互基础用 Radix**（`@radix-ui/react-*`），不自己写焦点管理、弹层定位。浮层一律 portal 并支持碰撞翻转。
3. **样式只用 token**：颜色 `bg-surface` / `text-fg-muted` / `border-border`…；阴影 `shadow-card` 等；圆角五档；字号用第 4 节的类。组件内部可以用 `bg-(--gray-300)` 引用原始色阶，组合阴影写 `shadow-[var(--shadow-control),var(--focus-ring)]`，但不写十六进制颜色。
4. **结构写法与现有组件一致**：`React.forwardRef`；有变体用 `cva`；类名合并用 `cn()`；接受 `className`；受控 / 非受控都支持（`value` + `defaultValue` + `onValueChange`）。
5. **尺寸对齐**：高度用 `--control-sm/md/lg`、`--row`；图标 16px（sm 14px）；内边距按 4px 网格。
6. **把状态做全**：hover、active、focus-visible（`shadow-focus-ring`）、disabled、loading、invalid、空数据。
7. **层级对号入座**：内嵌在卡片里的是 −1 / L1；弹出的是 L2（`shadow-raised`）；打断的是 L3（`shadow-overlay` + 遮罩）。
8. **蓝色守限额**：新组件默认不用蓝色，只在选中、当前、焦点、主操作上出现。
9. **不加灰色说明文字**；可点击的东西有可见的悬停态；图标按钮有 `aria-label`。
10. 在用到它的页面里把各种状态都摆一遍，`npm run dev` 打开自查；然后跑规范检查和类型检查。

---

## 11. 禁止清单

- 十六进制 / rgb 颜色、Tailwind 默认色板、默认字号、默认阴影、`rounded-xl` 以上（规范检查会拦）。
- 一屏多个实心蓝按钮；蓝色大背景、渐变、玻璃拟态、装饰插画。
- 表单提示语、标题副标题等灰色解释文字。
- 表格人员列头像、选中行背景色、斑马纹、只高亮单个单元格的悬停。
- 侧栏收起后仍显示文字（被挤成竖排）。
- 自定义 Badge 颜色或第二种 Badge 样式。
- 分页页大小 10/20/50/100 以外的值。
- 页面级 `PageHeader` 面包屑（在 AppShell 内）。
- 全屏转圈加载、`alert()` / `confirm()` 原生弹窗。

---

## 12. 技术选型

Strata 的组件只依赖 React、Radix、cva、clsx、tailwind-merge、lucide-react、date-fns。下表中标「始终」的库每个项目都装；其余**不预装**，真的用到对应场景时才引入。同一件事只用表里这一个。

| 用途 | 统一使用 | 什么时候引入 | 不要用 |
|---|---|---|---|
| 组件与样式 | Strata（本仓库组件 + `theme.css`） | 始终 | shadcn 官方组件（`npx shadcn add`）、Ant Design、MUI 等其他组件库 |
| 图标 | `lucide-react@0.488.0` | 始终 | 其他图标库、内联手写 SVG 图标（Logo 除外） |
| 路由 | `react-router@7.18.4` | 始终。路由表写在 `src/app/routes.tsx`，项目用 `createBrowserRouter`，单文件原型用 `createHashRouter` | 自己用 state 切换页面、`window.location` 跳转；TanStack Router、wouter。不升到 8.x（要求 React 19） |
| 表单与校验 | `react-hook-form@7.90.0` + `zod@4.6.7` + `@hookform/resolvers@5.9.2` | 始终（只要有表单）。写法见第 15 节 | Formik、手写 useState 表单校验、yup |
| 日期 | `date-fns@4.4.0` | 始终（日期组件依赖它） | moment、dayjs、手写日期计算 |
| 动画 | 优先 CSS（`theme.css` 里的 `animate-*`）；复杂动效用 `motion@14.4.0` | 列表增删时其余项平滑挪位、拖拽回弹、数字滚动、共享元素过渡等 CSS 做不好的效果 | 为开合、淡入这类简单效果引入 Motion；react-spring、GSAP |
| 图表 | `echarts@6.1.0`，通过 Strata 的 `Chart` 与图表生成函数使用（见第 13 节） | 折线、柱状、占比、散点、热力、漏斗、柱线组合等任何数据图 | Recharts、Chart.js、AntV；手写 ECharts 配色和样式 |
| 可拖动分栏 | `react-resizable-panels@4.14.7`，通过 Strata 的 `Resizable*` 组件使用 | 编辑器 + 结果、对话 + 结果、目录树 + 详情等需要用户调宽高的分栏 | 自己写拖拽调宽；用它做应用外框（外框固定用 AppShell） |
| 拖拽 | `@dnd-kit/core@6.3.1`、`@dnd-kit/sortable@10.0.0`、`@dnd-kit/utilities@3.2.2` | 排序列表、看板、仪表盘布局、把字段拖进维度 / 指标区 | react-beautiful-dnd、原生 HTML5 拖拽 |
| 前端状态 | `zustand@5.0.15` | 跨页面或跨组件共享的前端状态：当前用户、全局筛选、侧栏收起、会话列表 | Redux、MobX、为共享状态层层传 props 或滥用 Context |
| 后端数据 | `@tanstack/react-query@5.104.5` | 始终。所有接口请求：加载中、缓存、重新请求、提交后刷新；hooks 写在 `src/api/` | 在 `useEffect` 里手写请求；把接口数据存进 Zustand |
| 模拟数据 | 本地数据 + 假延迟（`src/mocks/`） | 后端还没好时。**只有 `src/api/` 能引用 `src/mocks/`**，页面永远通过 `src/api/` 拿数据；接真实接口时只改 `src/api/` | MSW、json-server；在页面里直接 import 假数据 |

使用约定：

- **组件内部的状态**（下拉是否展开、输入框内容）继续用 `useState`，不放进 Zustand。
- **Zustand** 按业务拆成多个小 store（`src/stores/<name>.ts`），不建一个大而全的 store。
- **TanStack Query** 的请求函数集中放在 `src/api/`；查询键统一写成数组，如 `['queries', { page, status }]`。加载中用组件自带的 `loading`（DataTable、Button）或 `Skeleton`，失败用 `toast` 或 `Alert`。
- **可拖动分栏**直接用可选组件 `Resizable*`，不直接用库自带的 `Group` / `Separator`。分隔条平时是 1px `border-border` 细线（或卡片间隙），悬停和拖动时变成 `ring` 色，不加粗、不放把手图标。面板背景仍按层级用 `bg-surface` / `bg-canvas`。
- **拖拽**时被拖的元素用 `shadow-raised` 抬起，落点用 `border-primary-line` + `bg-primary-soft` 标出；列表排序加拖动把手（Lucide `GripVertical`，`text-fg-subtle`）。
- **Motion** 的时长与 CSS 动画保持一致：浮层 120–160ms，列表挪位 200ms，统一 ease-out；不做弹簧回弹过大的效果。

---

## 13. 图表

图表用 ECharts，通过可选组件 `src/components/optional/chart/` 使用（需要 `echarts@6.1.0`）。颜色、字体、阴影都从 `theme.css` 读取，不在图表代码里写颜色。没装 ECharts 的项目，只有指标卡迷你趋势（`Sparkline`）和简单单系列柱状图（`BarChart`）可用。

### 用法

```tsx
import { Chart, lineChart, barChart, comboChart } from '@/components/chart';

<Card title="各区域 GMV">
  <Chart height={280} option={lineChart({ categories: months, series: [{ name: '华东', data: [...] }, { name: '华南', data: [...] }], format: yuan })} />
</Card>
```

- 一律用生成函数拿 option：`lineChart`、`barChart`、`rankingChart`、`donutChart`、`comboChart`、`scatterChart`、`heatmapChart`、`funnelChart`。确实需要特殊配置时，在生成结果上改字段，不从零手写 option。
- `Chart` 的 `loading`：首次加载显示柱形骨架；已有图形时保留旧图并变淡。`empty`：卡片高度不变，中间显示「暂无数据」。`group`：多张图悬停联动。
- 数值格式用 `fmt.compact`（1,284 / 12.8万 / 3.6亿）、`fmt.number`（千分位）、`fmt.percent`（12.4%），负数用真正的减号「−」。

### 选哪种图

| 要表达 | 用 | 说明 |
|---|---|---|
| 随时间变化 | `lineChart` | 多系列最多 4 条；单系列可加面积（8% 透明度）和终点数值；对比期（去年同期、上期）用 `compare` 画成灰线 |
| 当前期 vs 历史 | `barChart({ highlight: 'last' })` | 历史柱灰色、当前一根蓝色 |
| 环比 / 同比 | `barChart({ compare })` | 对比期灰色、当前期蓝色并排 |
| 类目比较 | `barChart` | 单系列全部用 1 号蓝；多个系列并排（最多 3 个）；类目名长或超过 12 个用 `horizontal` |
| 构成随时间变化 | `barChart({ stack: true })` | 段间 2px 白缝，只有最上一段圆角 |
| 排名 | `rankingChart` | 横向细条，从大到小，数值标在末端，默认最多 10 项 |
| 占比 | `donutChart` | 一眼看构成，最多 6 段，超出合并为灰色「其他」；数值接近时改用条形图；卡片宽度不小于 400px |
| 量 + 率 | `comboChart` | 左轴柱（量）、右轴线（率）；柱在下半区、线在上半区，每侧只标自己范围内的刻度；只有这种图用双轴 |
| 两个变量的关系 | `scatterChart` | 最多 3 组；更多分组拆成多张小图 |
| 时段 × 周期的密度 | `heatmapChart` | 单一蓝色色阶，右上角色阶图例 |
| 转化步骤 | `funnelChart` | 有序蓝色色阶，右侧标数量和较上一步转化率 |
| 只有一个数 | `StatCard` | 一根柱、两段饼都不画，直接写数字 |

### 配色

- 分类色 `chart-1` → `chart-8` 按固定顺序分配：石板蓝、赭黄、青绿、灰紫、玫瑰、湖蓝、橄榄绿、梅紫。同一实体在所有图里保持同色（用 `slot` 固定序号），过滤掉某个系列时其余系列不换色；第 9 个起合并为「其他」。
- 低饱和的一套，贴近白灰主体。已通过色盲安全校验：相邻色在红绿色盲模拟下 ΔE ≥ 10.8，正常视觉 ΔE ≥ 15.5，白底对比 ≥ 3.3:1。改色前要重新校验。
- 灰色 `chart-muted` 表示对比期、历史数据、非重点；蓝色只给当前或重点。
- 顺序色阶 `chart-seq-*`（热力图）：单一蓝色浅 → 深。有序色阶 `chart-ord-*`（漏斗、等级）：深 → 浅，最浅一档对白底 ≥ 2:1。发散：`chart-1`（高于基准）↔ `chart-div-neg`（低于基准），中点 `chart-div-mid`。
- 成功、警告、失败色只用于真正表示状态的数据，并配图标和文字，不当作普通系列色。

### 样式规则（生成函数已内置，手改时也要遵守）

- 柱宽最多 24px，顶部 4px 圆角、底部平直；排名条形 12px。线宽 2px，平时不显示数据点（柱线组合除外）。
- 网格线只有横向，1px 实线 `chart-grid`，不用虚线；数值轴不画轴线，类目轴画一条 `chart-axis` 基线；刻度文字 11px `chart-label`。
- 两个及以上系列必须有图例（左上角，8px 圆角色块）；单系列不显示图例，由卡片标题说明。
- 数值标签只标重点：条形末端、单条折线终点；不在每个点上写数字。文字一律用文字色，不用系列色。
- 悬停：折线、柱状显示竖向参考线或整列浅灰底，提示框为浅色（白底、细边框、浮起阴影），每行「色块 · 名称 · 右对齐数值」，堆叠图附合计。
- 双轴只用 `comboChart`；两条线或两组柱放在同一轴上比较，量级差太多时拆成两张图并用 `group` 联动。

### 图表卡片

- 图表放在 `Card` 里：左上标题（写清楚指标和范围，如「各区域 GMV」）；右上依次是时间范围 `SegmentedControl`、图表 / 表格切换、更多菜单。同一页多张图时，时间范围放在页面顶部统一控制，不在每张卡片里重复。
- 每张图都能切换成表格，表格里能读到图上的全部数值。
- 两张图并排时，卡片高度一致；图表高度含坐标轴文字，不能出现卡片内部滚动条。

---

## 14. 项目结构、路由与数据

### 目录

```
theme.css、fonts/      token 与字体（原型里放在前端目录根部）
src/
  app/
    routes.tsx        路由表（唯一）。每个页面一个路由，面包屑写在 handle.crumb
    app-layout.tsx    外框：AppShell + Sidebar + Topbar + <Outlet />，面包屑与用户菜单在这里统一生成；项目不改它
    nav.tsx           外框文字 SHELL、侧栏导航 useNav()（key 就是路由路径，按角色过滤）、命令面板分组 useCommandGroups()、用户菜单 useUserMenu()
    providers.tsx     QueryClientProvider + Toaster
  pages/<模块>/<页面>.tsx   页面，只负责组合组件和调用 src/api
  api/<资源>.ts       接口层：fetch 函数 + 查询键 + useXxx hooks；类型也从这里导出
  api/query-client.ts 全局 QueryClient
  api/errors.ts       ApiError（接口报错，带 HTTP 状态码）；mocks 的 fail() 也抛它
  api/session.ts      当前用户：useCurrentUser()（页面）、getCurrentUser()（api）；接真实登录时只改它
  mocks/              模拟数据与 delay()、演示账号 users.ts、假数据生成器 gen.ts；只有 api/ 能引用
  stores/<名称>.ts    Zustand（只放跨页面的前端状态）
  components/ui/      Strata 组件；components/chart/ 等可选组件
  lib/utils.ts        cn()
  main.tsx            createRoot + <Providers><RouterProvider router={router} /></Providers>；原型用 createHashRouter（app.html 双击可开），产品可换 createBrowserRouter
```

### 路由

- 路径规则：列表 `/queries`，详情 `/queries/:id`，新建 `/queries/new`，编辑 `/queries/:id/edit`，设置 `/settings/<分组>`。模块下有子模块时路径分层（`/data/tables/:name`）。
- 外框是布局路由（`element: <AppLayout />`），所有业务页面是它的子路由；登录页、403、404 这类不需要外框的页面放在布局路由之外。
- 面包屑：每一级路由写 `handle: { crumb: '查询' }`，动态的写函数 `crumb: (m) => m.params.name`。页面里不再写面包屑。
- 侧栏选中项由当前路径计算（最长前缀匹配），点击后 `navigate(key)`。页面内跳转用 `useNavigate()` 或 `<Link>`，不用 `window.location`。
- 找不到的路径进 404 页（`path: '*'`）。

### 数据

- 页面只从 `src/api/` 导入：`const { data, isPending } = useQueryList()`。页面里不出现 `fetch`、`axios`、`@/mocks`。
- 每个资源一个文件：内部的 fetch 函数（先用 `delay(mock)`，后端好了换成真实请求）、集中定义的查询键、导出的 hooks。写操作用 `useMutation`，成功后让同一前缀的查询失效。
- 加载：列表用 `DataTable loading`；页面首次加载用与真实布局同尺寸的 `Skeleton`；按钮提交用 `Button loading`。不做整页转圈。
- 失败：读取失败用 `LoadFailed`（`pages/errors/error-pages.tsx`）代替页面内容，403 显示无权限，其他显示「重试」；提交失败用 `toast({ tone: 'danger' })`，表单字段错误显示在对应 `Field` 下。
- 删除给「撤销」：mutation 返回被删的数据，toast 的撤销按钮调用恢复接口。
- 原型里 `delay()` 按地址的 `?state=loading | empty | error | forbidden` 返回四种状态（如 `#/queries?state=empty`），每个读数据的页面都要能正确显示这四种；接上真实接口后这个参数不再起作用。
- 权限：规则写在资源的 api 文件里（如 `api/members.ts` 的 `canManageMembers`）；页面按 `useCurrentUser()` 决定显示哪些导航和按钮，api 按 `getCurrentUser()` 过滤数据、拒绝没权限的读取（403）。原型里地址加 `?as=<演示账号 id>` 以这个身份打开，侧栏底部的用户菜单也能切换。

---

## 15. 表单

表单一律用 react-hook-form + zod。规则写在 zod schema 里；原生输入（`Input`、`Textarea`）用 `register`；受控组件（`Select`、`MultiSelect`、`Checkbox`、`RadioGroup`、`DatePicker`、`DateRangePicker`、`Tree`）用 `Controller`；错误信息只传给 `Field` 的 `error`，控件本身只加 `invalid`。

```tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(40, '名称不超过 40 个字'),
  source: z.string().min(1, '请选择数据源'),
  notify: z.boolean(),
});
type Values = z.infer<typeof schema>;

function QueryForm() {
  const save = useCreateQuery();                       // 来自 src/api/
  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', source: '', notify: true }, // 每个字段都给默认值
  });
  const onSubmit = handleSubmit(async (v) => {
    await save.mutateAsync(v);
    toast({ tone: 'success', title: '已保存' });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field label="名称" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name')} />
      </Field>
      <Field label="数据源" required error={errors.source?.message}>
        <Controller name="source" control={control} render={({ field }) => (
          <Select options={sourceOptions} value={field.value || undefined} onValueChange={field.onChange} invalid={!!errors.source} />
        )} />
      </Field>
      <Controller name="notify" control={control} render={({ field }) => (
        <Checkbox label="变更后通知使用者" checked={field.value} onCheckedChange={field.onChange} />
      )} />
      <ActionBar><Button onClick={cancel}>取消</Button><Button type="submit" variant="default" loading={save.isPending} disabled={!isDirty}>保存</Button></ActionBar>
    </form>
  );
}
```

- 校验时机：默认提交时校验，提交后改动即时重新校验（react-hook-form 默认行为），不在输入第一个字时就报错。
- 错误文案写「请输入名称」「名称不超过 40 个字」这类直接的话，不写原因和建议。
- 提交中主按钮 `loading`；没有改动时「保存」可禁用（`isDirty`）；离开有未保存改动的页面时用确认弹窗提醒。
- 必填用 `Field required`（红色星号），不写「（必填）」。
- 表单里的布尔值用 `Checkbox`（点保存才生效）；`Switch` 只用于点了立即生效的开关（列表行里的启用 / 停用）。
- 表单布局：弹窗里单列，底部 `DialogFooter`；整页表单用 `FormSection` 分组（每组 1–2 列），页面根节点 `flex min-h-full flex-col`，底部 `ActionBar` 吸底（左侧删除、上一步，右侧取消 + 主操作）；设置页这种「一张卡片一组」的，保存放在卡片 `footer`。
- 离开保护：`const guard = useUnsavedGuard(isDirty && !isSubmitSuccessful)`，渲染 `{guard.dialog}`；提交成功后用 `guard.leave(() => navigate(...))` 放行。参考 `src/app/unsaved-guard.tsx`。
