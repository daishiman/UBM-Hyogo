# ドキュメント更新履歴 — issue-837-schema-alias-bulk-rollback

本タスク（`implemented_local_evidence_captured` / UI task / VISUAL）で発生した実装・仕様・skill sync の更新履歴。

## workflow-local

| 種別 | パス | 内容 |
| --- | --- | --- |
| 更新 | `index.md` / `artifacts.json` / `outputs/artifacts.json` | workflow_state を implemented local evidence captured に再分類 |
| 更新 | `outputs/phase-12/*.md` | automation-30 再検証結果に合わせ、コード未実装 close-out を撤回 |
| 新規 | `outputs/phase-11/typecheck-local.txt` | local typecheck PASS evidence |
| 新規 | `outputs/phase-11/focused-vitest-local.txt` | focused Vitest 69 PASS evidence |

## implementation

| 種別 | パス | 内容 |
| --- | --- | --- |
| 更新 | `apps/web/src/lib/admin/api.ts` | `rollbackSchemaAliasBulk` と row-level error mapping を追加 |
| 更新 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | HistoryPane bulk rollback mode を追加 |
| 新規 | `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | bulk rollback confirm/result modal |
| 新規 | `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` | selection / submit / partial failure state hook |
| 新規 | `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx` | hook state machine regression（selection / modal rows / success / partial failure） |
| 更新/新規 | focused specs | API / modal / panel regression coverage |

## system specs / skill ledgers

| 種別 | パス | 内容 |
| --- | --- | --- |
| 更新 | `docs/00-getting-started-manual/specs/01-api-schema.md` | bulk rollback client fan-out contract |
| 更新 | `docs/00-getting-started-manual/specs/11-admin-management.md` | HistoryPane bulk rollback UI contract |
| 更新 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | quick lookup entry |
| 更新 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | resource-map entry |
| 更新 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow current facts |
| 新規 | `.claude/skills/aiworkflow-requirements/references/workflow-issue-837-schema-alias-bulk-rollback-artifact-inventory.md` | artifact inventory |
| 更新 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | sync log |
| 更新 | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | automation-30 close-out log |

## 該当なし

- 新 D1 migration: なし
- 新 API endpoint: なし
- commit / push / PR / Issue mutation: user-gated のため未実行
