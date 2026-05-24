# [#201] [task-new-worktree-claude-settings-template-001] scripts/new-worktree.sh への .claude/settings.local.json テンプレート組込み

## メタ情報

```yaml
issue_number: 201
title: [task-new-worktree-claude-settings-template-001] scripts/new-worktree.sh への .claude/settings.local.json テンプレート組込み
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/201
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`scripts/new-worktree.sh` 実行時に `.claude/settings.local.json` のテンプレートを worktree 内へ自動配置し、project-local-first 方針（hybrid 採用）が新規 worktree でも初回から有効になる状態を作る。

## 仕様書

`docs/30-workflows/unassigned-task/task-new-worktree-claude-settings-template-001.md`

## 発見元

`task-claude-code-permissions-project-local-first-comparison-001` Phase 5 比較表 §6（再発リスク対策）/ Phase 12 unassigned-task-detection（候補 #3）

## 前提

- `task-claude-code-permissions-apply-001` の採用案確定後に着手（spec_only で起票し apply 完了を待つ）

## 主な受入条件

- 新規 worktree 作成直後に `.claude/settings.local.json` が配置されている
- bypass 動作の手動 smoke が成立
- テンプレ正本の保管場所と gitignore 方針が明文化
