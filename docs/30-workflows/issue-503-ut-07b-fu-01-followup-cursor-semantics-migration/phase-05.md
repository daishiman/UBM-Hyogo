# Phase 5: cursor 列 migration 実装仕様（0015）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 実装区分 | 実装仕様書（migration） |

## 目的
`apps/api/migrations/0015_schema_diff_queue_cursor.sql` の up / down SQL を確定する。`schema_diff_queue` に `last_processed_id INTEGER` を追加し、cursor mode が 1 batch あたり O(batch_size) のスキャンで完了できるようにする。既存 0008 の `backfill_cursor TEXT` および 0014 の dedupe / failed_items_json と直交させる。

## 実行タスク
詳細は `outputs/phase-5/phase-5.md` を正本とする。

## 統合テスト連携
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` で staging に適用する。
- `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で 0014 → 0015 の順序整合を確認する。
- Phase 4 の vitest fixture では migration 適用済みの local D1 を前提とする。

## 参照資料
- `outputs/phase-5/phase-5.md`
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`
- 起票元 §2.2 / §3.1 / §5 品質要件

## 成果物
- `outputs/phase-5/phase-5.md`
- `apps/api/migrations/0015_schema_diff_queue_cursor.sql`（仕様確定。実装は Phase 13 まで保留）

## 完了条件
- up / down SQL が確定し、既存 0014 と column 順序競合がない。
- 既存 `backfill_cursor TEXT` を削除しないこと（後方互換のため）が明記されている。
- 適用コマンドと verify コマンドが記載されている。
