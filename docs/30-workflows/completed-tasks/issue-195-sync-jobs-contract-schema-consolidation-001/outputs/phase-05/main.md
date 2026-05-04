# Phase 5 — 既存 contract test カバレッジ棚卸し

## 既存テストカバレッジ
- ✅ `SYNC_JOB_TYPES === [SCHEMA_SYNC, RESPONSE_SYNC]` 値断言
- ✅ `SYNC_LOCK_TTL_MINUTES === 10` / `SYNC_LOCK_TTL_MS === 10*60*1000`
- ✅ `parseMetricsJson` の invalid JSON fallback
- ✅ `schemaSyncMetricsSchema` の write_count / processed_count
- ✅ `assertNoPii` の response_email 拒否

## 不足ケース
- ❌ `SYNC_JOB_TYPES === ["schema_sync", "response_sync"]` リテラル値断言
- ❌ `SYNC_LOCK_TTL_MS === 600000` 数値リテラル断言
- ❌ PII キーではない（例: source）下に email 形式値が混入したケースの拒否

## 結論
Phase 7 で上記 3 ケース追加 + ts 側で email 形式検出ロジック追加。
