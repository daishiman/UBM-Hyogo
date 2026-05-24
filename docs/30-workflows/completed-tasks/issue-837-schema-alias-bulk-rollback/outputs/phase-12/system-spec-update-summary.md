# システム仕様更新サマリ — issue-837-schema-alias-bulk-rollback

本タスクは `implemented_local_evidence_captured`（UI task / VISUAL / runtime screenshot pending）。Phase 12 close-out ルールに従い Step 1-A〜1-C と Step 2 を same-wave sync で実反映した。

## Step 1-A: タスク完了記録

| 対象 | 更新内容 | 状態 |
| --- | --- | --- |
| aiworkflow-requirements quick-reference / resource-map | Issue #837 bulk rollback implementation entry を追加 | done |
| aiworkflow-requirements `task-workflow-active.md` | Issue #837 current facts を追加 | done |
| aiworkflow-requirements artifact inventory | workflow-issue-837 artifact inventory を追加 | done |
| aiworkflow-requirements LOGS | close-out entry を追加 | done |
| task-specification-creator LOGS | automation-30 close-out entry を追加 | done |

## Step 1-B: 実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| 記録するステータス | `implemented_local_evidence_captured / implementation / VISUAL / runtime_screenshot_pending_user_gate` |
| workflow root | `docs/30-workflows/issue-837-schema-alias-bulk-rollback/` |
| implementation targets | `apps/web/src/lib/admin/api.ts`, `SchemaDiffPanel.tsx`, `SchemaDiffBulkRollbackModal.tsx`, `useSchemaDiffBulkRollbackSelection.ts` |
| focused tests | API helper / hook state machine / modal / panel regression |

## Step 1-C: 関連タスク current facts

| 関連 | 更新内容 |
| --- | --- |
| Issue #778 | single rollback endpoint / audit を bulk rollback の per-alias 実行基盤として再利用 |
| Issue #776 | bulk resolve の client-side bounded fan-out / modal / selection pattern を rollback へ対称適用 |
| followup-006 source | `consumed` + `canonical_workflow` を追記 |
| followup-005 / followup-007 | 既存独立タスクとして維持。Issue #837 で重複起票しない |

## Step 2: システム仕様更新

| 追加 contract | 実装ファイル | 仕様反映 |
| --- | --- | --- |
| `rollbackSchemaAliasBulk(rows, options?)` | `apps/web/src/lib/admin/api.ts` | `01-api-schema.md`, aiworkflow ledgers |
| `SchemaAliasRollbackBulkRowResult` | `apps/web/src/lib/admin/api.ts` | 409/404/401/403/network kind mapping |
| `SchemaDiffBulkRollbackModal` | `apps/web/src/components/admin/` | `11-admin-management.md` |
| `useSchemaDiffBulkRollbackSelection` | `apps/web/src/components/admin/hooks/` | HistoryPane selection / partial failure state |

## User-gated boundary

Runtime screenshot / staging smoke / commit / push / PR / CLOSED Issue mutation は user 明示承認後に実行する。
