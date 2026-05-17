# Phase 2: policy 設計

## 追加 policy 1: workers-kv-writes-per-day

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

threshold = `floor(1000 * 0.8)` = **800 writes/day**

## 追加 policy 2: workers-kv-stored-bytes

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

threshold = `floor(1073741824 * 0.8)` = **858993459 bytes (~819 MiB)**

## 命名規則の整合性

- `^[a-z0-9-]+$` 準拠
- 既存命名と整合: `workers-requests`, `d1-read-queries`, `d1-write-queries`, `pages-build`, `r2-class-a`
- 新 policy: `workers-kv-writes-per-day`, `workers-kv-stored-bytes`

## 初期 enabled 状態

両 policy とも `enabled: false`。Phase 13 後の別 wave で 5 営業日 baseline 取得後に `true` に切り替える。
