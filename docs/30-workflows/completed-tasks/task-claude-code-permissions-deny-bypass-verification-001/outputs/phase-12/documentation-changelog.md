# Documentation Changelog

| 項目 | 内容 |
| --- | --- |
| 目的修正 | `spec_created` と整合するよう、実効性確定から判定方針 / runbook 仕様化へ変更 |
| AC 修正 | 実検証ログ前提を検証ログテンプレートへ変更 |
| 安全修正 | force push を `--dry-run` 必須へ変更 |
| Runbook 修正 | `main` ref / dummy commit / settings.local.json 書き込み / destructive pattern の refusal-only 観測を追加 |
| Phase 7 | 達成済み表現を covered / queued へ変更 |
| Phase 12 | サマリ + 6 canonical 詳細成果物として整理 |

## Phase 12 Step 別記録

| Step | 変更内容 | 対象 |
| --- | --- | --- |
| Step 1-A | active 台帳、LOGS、SKILL-changelog、task-specification-creator LOGS へ同期 | `task-workflow-active.md`, `LOGS.md`, `SKILL-changelog.md` |
| Step 1-B | `spec_created` と実機検証未実施を分離し、execution-001 を proposed follow-up として登録 | `task-workflow-backlog.md`, `system-spec-update-summary.md` |
| Step 1-C | apply-001 を既存 completed-tasks 配下の未実施指示書として補正 | `claude-code-settings-hierarchy.md`, `task-workflow.md`, `phase-12.md` |
| Step 2 | 新規 runtime API / interface は追加なし。Claude Code 運用仕様の関連タスク状態だけ更新 | `claude-code-settings-hierarchy.md` |

## Workflow-local / Global Skill Sync

| 区分 | 内容 |
| --- | --- |
| workflow-local | runbook、verification-protocol、Phase 12 6成果物、Phase 7/10/11 の apply-001 参照を補正 |
| global skill sync | aiworkflow-requirements の active/backlog/task-workflow/settings hierarchy/log/changelog を補正。task-specification-creator は LOGS に deferred feedback を記録 |
