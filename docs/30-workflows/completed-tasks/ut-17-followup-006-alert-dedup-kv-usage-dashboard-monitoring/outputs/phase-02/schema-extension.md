# Phase 2: schema 拡張要否判定

## 結論

**拡張不要**。

## 根拠

- `alert_type` は `billing_usage_alert` のみ使用（既存 enum で充足）
- conditions 構造は既存 `metric + percentage` で充足
- mechanisms.webhooks は `ut-17-relay` を再利用

## 後方互換性

既存 5 policy (`workers-requests`, `d1-read-queries`, `d1-write-queries`, `pages-build`, `r2-class-a`) に対する schema validation は無変更で PASS する。
