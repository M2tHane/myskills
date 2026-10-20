# myskills

我的 Claude Code skills。

## Skills

| Skill | 用途 | 调用 |
|---|---|---|
| [grill-spec](skills/grill-spec/SKILL.md) | 把项目想法拷问清楚，给出后端技术方案选型，在项目 `docs/` 下写出 `PRD.md` 和 `ARCHITECTURE.md` | `/grill-spec [项目想法]` |

## 安装

```bash
git clone git@github.com:M2tHane/myskills.git
ln -s "$PWD/myskills/skills/grill-spec" ~/.claude/skills/grill-spec
```

每个 skill 建一个软链接。在仓库里改完立即生效，新开的会话就能用。

## 目录

```
skills/
  <名字>/
    SKILL.md        流程说明（frontmatter 里的 name 就是调用名）
    templates/      该 skill 用到的模板
```
