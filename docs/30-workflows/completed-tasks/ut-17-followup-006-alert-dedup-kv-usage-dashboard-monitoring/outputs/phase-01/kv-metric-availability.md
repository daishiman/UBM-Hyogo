# KV metric availability snapshot

確認日: 2026-05-16

| metric | native notification alert | alert_type | filter |
| --- | --- | --- | --- |
| writes/day | あり | billing_usage_alert | Account 集計のみ |
| reads/day | あり | billing_usage_alert | Account 集計のみ（本 wave では採用しない。`ALERT_DEDUP_KV` の dedup 用途は write/storage guard が主リスク） |
| stored bytes | あり | billing_usage_alert | Account 集計のみ |
| operation error rate | なし | — | GraphQL Analytics で pull 観測 |
| latency | なし | — | Workers Analytics で pull 観測 |

## decision

- 追加対象: writes/day, stored bytes
- policy 名は `workers-kv-writes-per-day` / `workers-kv-stored-bytes`
- namespace filter は無いため、文言は `ALERT_DEDUP_KV` 固有監視ではなく Workers KV account quota guard として扱う。現行 account に KV namespace が `ALERT_DEDUP_KV` のみであることを runtime apply 前の確認条件にする
- 一時 disabled で repo に置き、apply 後は user 承認済みの staging 擬似発火検証のみ実施
- latency / error rate は runbook の四半期 deep-dive review 項目に固定
