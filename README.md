# myskills

我的 Claude Code skills。

## Skills

| Skill | 用途 | 调用 |
|---|---|---|
| [grill-spec](skills/grill-spec/SKILL.md) | 把项目想法拷问清楚，给出后端技术方案选型，在项目 `docs/` 下写出 `PRD.md`（pi-forge 输入）、`PRD-HUMAN.md`（精简版）和 `ARCHITECTURE.md`（技术栈） | `/grill-spec [项目想法]` |
| [ui-prototype](skills/ui-prototype/SKILL.md) | 读 PRD 与技术栈，用选定的 UI 套件在 `docs/prototype/` 生成可点击的前端原型；验收后整理成 pi-forge 的输入。套件在 `kits/`，目前有 [Strata](skills/ui-prototype/kits/strata/README.md) | `/ui-prototype [修改意见]`；没有 PRD 时 `/ui-prototype quick <想看的页面>` 先做几页 |
| [clarify-requirement](skills/clarify-requirement/SKILL.md) | 在已有项目里提新需求时用：先读项目摸清背景，逐个追问模糊点，再用大白话加一个具体例子讲清准备怎么做，确认后才动手 | 描述需求时自动触发，或 `/clarify-requirement [需求]` |

## 从想法到开发

```
/grill-spec      → docs/PRD.md、docs/PRD-HUMAN.md、docs/ARCHITECTURE.md
/ui-prototype    → docs/prototype/（你点过、通过后交付），并补全 ARCHITECTURE.md 的前端一节
/forge-build     → 交给 pi-forge 多 agent 开发
```

## 安装

用 [skills](https://github.com/vercel-labs/skills) CLI 安装（会复制一份到 agent 的 skills 目录）：

```bash
npx skills add M2tHane/myskills --list                        # 看有哪些 skill
npx skills add M2tHane/myskills --skill clarify-requirement   # 装一个
npx skills add M2tHane/myskills -g                            # 全部装到全局
```

或者克隆后建软链接（在仓库里改完立即生效）：

```bash
git clone git@github.com:M2tHane/myskills.git
ln -s "$PWD/myskills/skills/grill-spec" ~/.claude/skills/grill-spec
ln -s "$PWD/myskills/skills/ui-prototype" ~/.claude/skills/ui-prototype
ln -s "$PWD/myskills/skills/clarify-requirement" ~/.claude/skills/clarify-requirement
```

每个 skill 建一个软链接。在仓库里改完立即生效，新开的会话就能用。

## 目录

```
skills/
  <名字>/
    SKILL.md        流程说明（frontmatter 里的 name 就是调用名）
    templates/      该 skill 用到的模板
    scripts/        该 skill 用到的脚本
    kits/           ui-prototype 的 UI 套件，每套一个文件夹，入口是 KIT.md
```
