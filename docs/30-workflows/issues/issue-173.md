# [#173] [skill-ledger A-3-5] skill-improvement Anchor 恒久追記（200 行ルール固定 ID 化）

## メタ情報

```yaml
issue_number: 173
title: [skill-ledger A-3-5] skill-improvement Anchor 恒久追記（200 行ルール固定 ID 化）
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/173
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

task-specification-creator references に skill-improvement Anchor を追記し、200 行未満ルール / fragment 原則 / mechanical split / mirror 同期義務を固定 ID で発行する。

## 仕様書

`docs/30-workflows/unassigned-task/task-skill-improvement-anchor-establishment-001.md`

## 検出元

skill-ledger A-3 Phase 12 (U-5) — 親 `skill-ledger-a3-progressive-disclosure` AC-10

## 主要 AC

- `.claude/skills/task-specification-creator/references/skill-improvement.md`（または既存 references 追記）に Anchor `skill-progressive-disclosure-200-line-rule` を発行
- 既存 5 skill の Anchors セクションから後方リンク
- `.agents` mirror 同期
- 本 PR は A-3 PR とは独立（AC-10 ロールバック独立性確保）

## 苦戦箇所対応

#4 ドッグフーディング矛盾の恒久解消策。U-7（loader doctor）から参照される基準 ID。
