# [#158] [UT-B1-IMPL] B-1 .gitattributes 実装

## メタ情報

```yaml
issue_number: 158
title: [UT-B1-IMPL] B-1 .gitattributes 実装
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/158
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

skill ledger 衝突防止 4 施策のうち B-1（保険施策）の実装。root `.gitattributes` に B-1 セクションを追加し、行独立な `_legacy.md` 系 Markdown のみに `merge=union` を適用する。

仕様書: `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes-implementation.md`
親タスク: skill-ledger-b1-gitattributes（仕様書作成は完了、root `.gitattributes` 実編集は未実施）
発見元: outputs/phase-12/unassigned-task-detection.md（2026-04-28）

## 受入条件（要旨）

- root `.gitattributes` に B-1 セクションを追加（解除条件コメント付き）
- 許可対象 `_legacy.md` 系のみ `merge: union`、JSON/YAML/`SKILL.md`/lockfile/code は `merge: unspecified`
- `**/*.md` の広域 glob を使用しない
- 2〜4 worktree smoke で unmerged files が 0 件
- Phase 11 evidence に `check-attr.log` / `worktree-smoke.log` を保存

## 依存・連携

- A-1 / A-2 / A-3 が main にマージ済みであること（前提）
- UT-B1-A2-REVIEW（A-2 完了レビュー時の B-1 残存確認）

詳細・苦戦箇所は仕様書参照。
