# myskills

我的 Claude Code skills。

## Skills

| Skill | 用途 | 调用 |
|---|---|---|
| [clarify-requirement](skills/clarify-requirement/SKILL.md) | 在已有项目里提新需求时用：先读项目摸清背景，逐个追问模糊点，再用大白话加一个具体例子讲清准备怎么做，确认后才动手 | 描述需求时自动触发，或 `/clarify-requirement [需求]` |

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
ln -s "$PWD/myskills/skills/clarify-requirement" ~/.claude/skills/clarify-requirement
```

每个 skill 建一个软链接，新开的会话就能用。

## 目录

```
skills/
  <名字>/
    SKILL.md        流程说明（frontmatter 里的 name 就是调用名）
    templates/      该 skill 用到的模板
    scripts/        该 skill 用到的脚本
```
