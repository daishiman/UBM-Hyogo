---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
user_approval_marker: outputs/phase-13/user-approval-issue-908-staging-rollback-notification-runtime-smoke-<timestamp>.md
---

# Phase 13: PR 作成 — タスク仕様書

| Phase | 13 | Phase名 | PR 作成（user-gated） |
| --- | --- | --- | --- |

---

## 前提

- すべての phase（特に Phase 11 staging runtime smoke）が完了済み
- typecheck / lint / verify-pr-ready 全 green
- secret 実値が evidence MD / git history に転記なし

---

## ブランチ

`feat/issue-908-staging-rollback-notification-runtime-smoke`（base: `dev`）

---

## PR 構成

- PR title: `feat(issue-908): schema alias rollback notification staging runtime smoke evidence`
- PR base: `dev`
- 本文: `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様に従い `outputs/phase-12/implementation-guide.md` を反映

---

## ユーザー承認

PR 作成・push・gh CLI 実行はすべて **ユーザー明示承認後のみ**。承認時 `outputs/phase-13/user-approval-issue-908-staging-rollback-notification-runtime-smoke-<timestamp>.md` を作成して記録。
