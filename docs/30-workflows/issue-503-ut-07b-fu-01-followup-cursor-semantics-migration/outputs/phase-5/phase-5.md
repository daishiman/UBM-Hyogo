# Phase 5: cursor 列 migration 実装仕様（0015）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/migrations/0015_schema_diff_queue_cursor.sql`（新規 / cursor 採用時のみ） |

## 目的

cursor mode が 1 batch あたり O(batch_size) スキャンで完了できるよう、`schema_diff_queue` に `last_processed_id INTEGER` を追加する migration の up / down SQL を確定する。既存 0008 の `backfill_cursor TEXT` および 0014 の `dedupe_key` / `failed_items_json` / `retry_count` / `last_error` / `last_processed_at` と直交させ、後方互換を維持する。

## 設計判断（起票元 §2.2 反映）

| 項目 | 採用案 | 不採用案 | 根拠 |
| --- | --- | --- | --- |
| 列の型 | `INTEGER` | `TEXT (last_processed_pk)` | response_fields の rowid / `id` は INTEGER PRIMARY KEY であり、SQLite の B-tree index 探索が最も効率的 |
| 配置先 | `schema_diff_queue` 既存テーブル | 新規 batch metadata テーブル | 既存 `backfill_cursor` と同じ row 単位で管理する方が rollback / 監視が単純 |
| NULL 許容 | NULL 許容 / DEFAULT NULL | NOT NULL DEFAULT 0 | remaining-scan mode の row は本列を使わないため NULL のまま放置できる必要がある |

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/migrations/0015_schema_diff_queue_cursor.sql` | 新規（cursor 採用時のみ） |

## up SQL（仕様）

```sql
-- 0015_schema_diff_queue_cursor.sql
-- UT-07B-FU-01-FOLLOWUP: cursor mode 切替用列追加。
-- 既存 backfill_cursor (TEXT, 0008) は remaining-scan mode 互換のため温存。
-- 0014 dedupe / failed_items_json / retry_count / last_error / last_processed_at と直交。

ALTER TABLE schema_diff_queue ADD COLUMN last_processed_id INTEGER;

-- `last_processed_id` は schema_diff_queue 行の progress marker。
-- next-batch 取得は response_fields(stable_key, id) を測定対象にするため、
-- schema_diff_queue(last_processed_id) index は作らない。
```

## down SQL（仕様）

```sql
-- 0015 rollback
ALTER TABLE schema_diff_queue DROP COLUMN last_processed_id;
```

> SQLite の `DROP COLUMN` は version 3.35 以降で利用可能。Cloudflare D1 の SQLite version はこれを満たす。

## 既存列との順序整合（起票元 §5 品質要件）

`schema_diff_queue` は 0001 init → 0008 backfill_cursor / backfill_status → 0014 dedupe / failed_items_json / retry_count / last_error / last_processed_at の順で列が積み増しされている。0015 は最末尾に `last_processed_id` を追加するため列順序衝突は発生しない。既存 SELECT 列リスト（`schemaDiffQueue.ts:96`）の修正は Phase 6 で別途行う。

## 適用コマンド

```bash
# staging 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 適用順 verify
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-5/migrations-list-staging.log
```

期待: `0015_schema_diff_queue_cursor` が `0014_schema_diff_queue_dedupe_failure` の直後に表示され、`applied_at` が単調増加であること。

## 検証クエリ（staging）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(schema_diff_queue);" \
  | tee outputs/phase-5/table-info.log
```

期待: `last_processed_id INTEGER` 列が存在し、`notnull=0` `dflt_value=NULL`。

## rollback 手順（採用判断不採用時）

```bash
# 不採用時は 0015 を apply しない。apply 済みの staging 検証環境は
# forward-only の新しい staging DB fixture で再作成し、_cf_KV を直接編集しない。
```

> `_cf_KV` など Cloudflare 内部管理テーブルの直接編集は禁止。rollback は env fallback (`remaining-scan`) と fixture 再作成で扱う。

## DoD（完了定義）

- [ ] up / down SQL が確定し、既存 0014 と column 順序競合がない
- [ ] 既存 `backfill_cursor TEXT` を残し後方互換を維持することが明記
- [ ] `schema_diff_queue(last_processed_id)` index を作らず、Phase 11 で `response_fields(stable_key, id)` query plan を測定する方針が確定
- [ ] staging 適用コマンドと verify コマンドが記載
- [ ] rollback 手順が記載

## 次 Phase の前提条件

Phase 6 で `schemaDiffQueue.ts` の SELECT 列リスト / 新規メソッドに `last_processed_id` を組み込む。
