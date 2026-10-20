# ui-prototype 测试

## fixture/

一个完整的测试项目输入：`docs/PRD.md`（采购协同，11 条需求、31 条验收标准、8 个页面、两个角色：采购员 / 采购主管）、`docs/PRD-HUMAN.md`、`docs/ARCHITECTURE.md`（「3. 前端」留给 ui-prototype 填）。

页面覆盖了套件的主要样板：概览、两个列表、两个详情、两个表单（其中一个有可增删的明细行），以及审批工作台。PRD 里的数字（条数、金额）是写给真实开发的，原型不用和它们对上。

## 怎么测

1. 把 `fixture/docs` 复制到一个空目录，作为项目根目录下的 `docs/`。
2. 开一个新的 agent，让它读本 skill 的 `SKILL.md` 并完整执行，无人值守：不问用户（选推荐项）、第 5 步视为用户选了「通过」、长时间运行的命令放后台。
3. 让它在项目根目录的 `bench.log` 里按时间戳记录每一步的开始、每一轮「发现问题 → 修改」、交给用户验收（handoff）、交付检查通过（done）。
4. 最后在项目根目录运行 `node <本 skill 目录>/scripts/check-export.mjs`，必须通过。

比较两个版本时，用 `git worktree` 把两个提交各检出一份，同时各开一个 agent，提示词只换 skill 目录和项目目录。
