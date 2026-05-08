# Skill Feedback Report

## テンプレ改善

| item | routing | evidence |
| --- | --- | --- |
| production switch + N day observation + forward-safe rollback template | promote | task-specification-creator に既存 NON_VISUAL runtime pending パターンがあるため、次回テンプレ化候補として LOGS に記録 |
| workflow post-step 3点（leakage grep / fallback alert / observation snapshot） | defer | 実装サイクル完了後に汎用化可否を判断 |

## ワークフロー改善

| item | routing | evidence |
| --- | --- | --- |
| Gate-A〜D を `artifacts.json.metadata.gates[]` で構造化 | formalized | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` |
| Phase 11 evidence path reservation schema | formalized | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` |

## ドキュメント改善

| item | routing | evidence |
| --- | --- | --- |
| `observability-monitoring.md` に Issue #549 contract 追加 | promoted same-wave | system spec update |
| `15-infrastructure-runbook.md` に D1 列を消さない rollback 原則を追記 | promoted same-wave | system spec update |
