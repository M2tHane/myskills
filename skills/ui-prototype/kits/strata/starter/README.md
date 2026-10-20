# 前端原型

由 ui-prototype 用 Strata 套件生成。需求以 [../PRD.md](../PRD.md) 为准。

## 怎么看

- 双击 `app.html`：完整的可点击原型，数据是假的。
- 每个页面一个 `<页面id>.html`，和 PRD 页面表的「原型文件」一致；打开后跳到 `app.html` 里的对应页面，文件里的注释写了这一页的源码位置。
- 四种状态：在地址后面加 `?state=loading`、`empty`、`error` 或 `forbidden`，例如 `app.html#/queries?state=empty`。
- 换身份：左下角用户菜单「切换演示身份」，或在地址后面加 `?as=<账号 id>`（账号见 `src/mocks/users.ts`）；和 `state` 一起用时写成 `?as=…&state=…`。

## 目录

| 路径 | 内容 |
|---|---|
| `DESIGN.md`、`theme.css`、`fonts/` | 界面规范、设计 token 与字体（`fonts/OFL.txt` 是字体许可证，不要删） |
| `src/components/ui/` | 公共组件，产品前端可以直接复用 |
| `src/pages/` | 各页面源码 |
| `src/api/`、`src/mocks/` | 接口层与假数据；页面只从 `src/api/` 取数据；当前用户在 `src/api/session.ts`，演示账号在 `src/mocks/users.ts` |
| `src/app/` | 路由、外框、导航 |
| `scripts/check.mjs` | 规范检查 |

## 怎么改

```bash
npm ci && npm run dev      # 预览，地址看命令输出（一般是 http://localhost:5173/#/<路由>）
npm run typecheck          # 类型检查
npm run check:ui           # 规范检查
npm run build:html         # 重新生成 app.html
rm -rf node_modules        # 改完删掉依赖
```

改完一定删掉 `node_modules`：pi-forge 读取本目录时不看 `.gitignore`，超过 500 个文件或 30 MB 会直接报错。
