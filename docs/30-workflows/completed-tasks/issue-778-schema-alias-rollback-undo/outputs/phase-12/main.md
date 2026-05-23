# Phase 12 output: main

[実装区分: 実装仕様書]

## task summary

Issue #778（CLOSED）の根本問題「SchemaDiffPanel alias resolve に取消経路がなく D1 直接修正が常態化」を最新コードベースに最適化して再起動。SchemaDiffPanel に rollback / undo UI と API endpoint、soft delete + 楽観ロックの migration を追加し、誤 resolve を API + 監査ログ経由で取り消せる経路を提供する。

## scope（本サイクル内完了）

- D1 migration `0019_schema_alias_soft_delete.sql`（`deleted_at` / `deleted_by` / `version` 列 + index 再作成。audit relation は既存 `audit_log.after_json.relatedAuditId` に保存）
- API endpoint `POST /admin/schema/aliases/:aliasId/rollback`
- API workflow `schemaAliasRollback` (`db.batch([softDelete, queueRestore, auditInsert])`)
- web helper `rollbackSchemaAlias`
- SchemaDiffPanel HistoryPane + ConfirmModal + UndoToast
- 正本 spec 2 ファイル追記（`11-admin-management.md` / `01-api-schema.md`）

## CONST_007 例外（明示分離）

- followup-003 schema diff history view（独立 UI screen、既存 unassigned-task を再利用）
- followup-005 rollback 後の集計再実行（集計バッチ仕様未確定）
- followup-006 bulk rollback（race condition 設計負荷）
- followup-007 rollback notification（通知チャネル未確定）

いずれも本タスク rollback / undo 経路の前提条件ではない。

## AC 達成状況

| AC | 状態 |
| --- | --- |
| AC-1〜AC-11（local） | 全 `spec_created`。実装後 Phase 09 で物理 pass |
| RAC-1〜RAC-3（runtime） | `PENDING_USER_GATE` |

## next action

1. Phase 06 実装手順を順次実行
2. Phase 11 で staging migration apply + visual baseline 取得（user-gated）
3. Phase 13 で PR base=dev 作成（user-gated）
