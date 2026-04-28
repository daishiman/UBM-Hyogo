# Phase 5: Implementation Runbook

## 状態

pending。ここでは派生実装タスクで使う `.gitattributes` 追記手順のみを固定し、本 design workflow では実編集しない。

## B-1 セクション

```gitattributes
# === B-1: append-only skill ledger merge=union ===
# 行独立な append-only Markdown のみを対象とする。
# 適用禁止: JSON / YAML / SKILL.md / lockfile / front matter Markdown
# 解除条件: A-2 fragment 化完了時に本セクション全体を削除する。
# broad glob (`**/*.md`) は禁止。現役 fragment を巻き込む。
.claude/skills/**/_legacy.md merge=union
.claude/skills/**/LOGS/_legacy.md merge=union
.claude/skills/**/changelog/_legacy.md merge=union
.claude/skills/**/lessons-learned/_legacy*.md merge=union
.claude/skills/**/SKILL-changelog/_legacy.md merge=union
# === /B-1 ===
```

## 検証

`git check-attr merge` で対象側 `union`、除外側 `unspecified` を確認する。
