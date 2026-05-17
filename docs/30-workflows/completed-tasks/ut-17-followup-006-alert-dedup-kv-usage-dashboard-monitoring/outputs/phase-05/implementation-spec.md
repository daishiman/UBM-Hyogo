# Phase 5: 実装仕様（ファイル差分）

## 1. infra/cloudflare-alerts/quota-base.json

```json
{
  "$schema": "./schema/quota-base.schema.json",
  "version": 1,
  "source": "https://developers.cloudflare.com/workers/platform/limits/",
  "snapshotAt": "2026-05-16",
  "values": {
    "workers_requests_per_day": 100000,
    "d1_read_queries_per_day": 5000000,
    "d1_write_queries_per_day": 100000,
    "pages_requests_per_month": 100000,
    "r2_class_a_per_month": 1000000,
    "r2_class_b_per_month": 10000000,
    "workers_kv_writes_per_day": 1000,
    "workers_kv_stored_data_bytes": 1073741824
  }
}
```

## 2. infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json (新規)

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "workers-kv-writes-per-day",
  "description": "Workers KV writes 80% of free-tier daily quota (ALERT_DEDUP_KV monitoring)",
  "alert_type": "billing_usage_alert",
  "enabled": false,
  "conditions": {
    "metric": "workers_kv_writes_per_day",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

## 3. infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json (新規)

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "workers-kv-stored-bytes",
  "description": "Workers KV stored data 80% of free-tier (TTL leak detection)",
  "alert_type": "billing_usage_alert",
  "enabled": false,
  "conditions": {
    "metric": "workers_kv_stored_data_bytes",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

## 4. infra/cloudflare-alerts/lib/__tests__/quota-base.spec.ts (拡張)

`fullBase` に KV キーを追加、KV writes / stored bytes の閾値計算ケースを追加。

## 5. infra/cloudflare-alerts/lib/__tests__/load.spec.ts (拡張)

`loadExpected` の policies 件数を 5 → 7 に更新（または件数アサーション不変なら no-op、後者を採用）。

## 6. infra/cloudflare-alerts/README.md (更新)

policy 一覧表 / 命名規則セクションに KV 2 policy を追加。

## 7. docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md (更新)

Step 4 説明文に「KV 監視 policy も `pnpm cf:alerts:diff` の対象」と追記、Step 4b の冒頭に「KV 観測 alert は IaC 化済」一文 + policy 名 2 件列挙。
