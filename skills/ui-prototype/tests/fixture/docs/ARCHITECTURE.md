# 采购协同 技术栈

| 项 | 内容 |
|---|---|
| 版本 | v1.0（2026-10-20） |
| 状态 | 已确认 |
| 相关文档 | [PRD.md](./PRD.md) |

## 1. 后端

- Python 3.13 + FastAPI 0.115，依赖管理用 uv 0.9。
- 认证：沿用公司统一账号（OIDC），服务端会话，Cookie 只在内网域名下。

## 2. 数据库

- PostgreSQL 17：每年约 1,500 张采购单、80 家供应商，单库足够。
- 访问用 SQLAlchemy 2.0，迁移用 Alembic 1.16。

## 3. 前端

由 ui-prototype 负责：生成原型时填入确切的技术栈与版本。

## 4. 测试与检查

- 后端测试：pytest 8.4，接口测试用 FastAPI 的 TestClient，连真实的 PostgreSQL，每次测试用自己的临时数据库。
- 验收测试：按 PRD 的 `REQ-xxx.ACn` 逐条调用 HTTP 接口，测试标题带 `[REQ-xxx.ACn]`。
- lint 与格式化：Ruff 0.14。

## 5. 运行与部署

- 公司内网一台 Linux 服务器，Docker Compose v2：`app`（uvicorn，同时提供 `/api` 和前端构建产物）与 `db`（postgres:17）。
- 缓存、队列、文件存储：不用。

## 6. 必须用与不能用的

- 必须用公司统一账号登录。
- 不能把数据放到公网服务上。

## 7. 选型说明

| 方案 | 组合 | 结论 |
|---|---|---|
| A | FastAPI + PostgreSQL | 采用：团队熟悉 Python，数据量小 |
| B | Django + PostgreSQL | 没采用：自带后台用不上，偏重 |
