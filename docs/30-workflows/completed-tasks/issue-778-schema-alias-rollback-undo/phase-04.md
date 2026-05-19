# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | spec_created |

## 目的

Phase 2-3 の設計を実装単位タスクに分解し、Phase 5-13 への割当てを確定する。

## タスク分解（単一責務）

| Task ID | 概要 | 種別 | 担当 Phase | 依存 |
| --- | --- | --- | --- | --- |
| T-01 | migration `0019_schema_alias_soft_delete.sql` 作成 | code | 6 | なし |
| T-02 | audit relation 保存先を application `audit_log.after_json.relatedAuditId` に固定し、`cf_audit_log` を変更対象から除外 | spec/code | 6 | T-01 |
| T-03 | `apps/api/src/workflows/schemaAliasRollback.ts` 新規作成（batch transaction） | code | 6 | T-01, T-02 |
| T-04 | `apps/api/src/routes/admin/schema.ts` に rollback endpoint 追加 | code | 6 | T-03 |
| T-05 | `apps/api/src/repository/schemaAliases.ts` に `softDeleteById` / `getById` 追加（既存ファイルが無ければ新規） | code | 6 | T-01 |
| T-06 | 既存 query への `WHERE deleted_at IS NULL` 追加（grep gate）  | code | 6 | T-01 |
| T-07 | `apps/web/src/lib/admin/api.ts` に `rollbackSchemaAlias` helper 追加 | code | 6 | T-04 |
| T-08 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` に HistoryPane / 確認 modal / undo toast 追加 | code | 6 | T-07 |
| T-09 | `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` 新規 spec | test | 7 | T-03, T-04 |
| T-10 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` に rollback / undo ケース追加 | test | 7 | T-08 |
| T-11 | `docs/00-getting-started-manual/specs/{11-admin-management,01-api-schema}.md` 追記 | docs | 8 | T-04 |
| T-12 | Playwright visual baseline に rollback modal screenshot 追加 | test | 11 | T-08 |
| T-13 | unassigned-task 新規 3 件作成（followup-005 / 006 / 007）+ 既存 followup-003 参照 + source followup-004 fold-state sync | docs | 12 | なし |
| T-14 | 原典 `serial-05-step-03-followup-004-...md` に `consumed_via_issue_778_rollback_undo_spec` 同期 | docs | 12 | T-04 |
| T-15 | PR base=dev で PR summary ドラフト作成 | docs | 13 | 全完了 |

## 並列実行可能性

- T-01 / T-13 は完全独立で並列可
- T-03/T-05/T-06 は T-01 完了後並列可
- T-07/T-08 は T-04 完了後で並列可
- T-09/T-10 は T-08 完了後で並列可

## 完了条件

- [x] T-01 〜 T-15 の依存関係確定
- [x] 各 task が単一責務原則を満たす
- [x] 並列可能タスクが明示済み

## 次 Phase

- 次: 5（実装計画）
- 引継: T-01〜T-15 依存グラフ
