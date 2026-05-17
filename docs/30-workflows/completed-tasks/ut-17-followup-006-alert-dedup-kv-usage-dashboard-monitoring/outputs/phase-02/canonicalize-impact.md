# Phase 2: lib (canonicalize / diff / api-client) 影響評価

## 結論

**lib 変更不要**。

## 理由

- 新 policy の構造は既存 template と完全に同形（`metric + percentage`、`mechanisms.webhooks[].name`）
- `applyQuotaBase` は `requireBase()` で `quota-base.json` の追加キーを参照するだけで動作
- `canonicalize.ts` の `POLICY_STRIP_KEYS` / `WEBHOOK_STRIP_KEYS` も変更不要
- `api-client.ts` の request body 構築ロジックは alert_type が `billing_usage_alert` のままなので影響なし
- `diff.ts` の比較ロジックは canonical form 上で差分検出するだけで構造不変
