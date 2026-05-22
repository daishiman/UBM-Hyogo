# Phase 2 成果物: アーキテクチャ

Phase 2 spec: `../../phase-02.md`

## 3 層構成 (確定)

1. **宣言ファイル層** — `infra/cloudflare-alerts/{quota-base.json, policies/*.json, webhooks/*.json}` (JSON Schema で `additionalProperties:false` を強制)
2. **Node 純関数層** — `infra/cloudflare-alerts/lib/{canonicalize,diff,resolve,quota-base,load,api-client,cli}.ts`
3. **シェル統合層** — `scripts/cf.sh alerts {list,diff,plan,apply}` (wrangler 直接呼び出しなし)

## データフロー

```
JSON declarations → load.ts → applyQuotaBase → canonicalize → expected
Cloudflare API     → listPolicies/listWebhooks → canonicalize (webhook id → name) → actual
expected vs actual → diffPolicy / diffWebhook → Drift[] → exit code (0/2) or JSON
apply: webhooks 先 (upsert) → policies 後 (webhook id 解決)
```

## Mock 切替

`CF_ALERTS_MOCK_DIR` を設定すると api-client が fixture を返す stub に切り替わる。
write 系は `${CF_ALERTS_MOCK_DIR}/write-log.txt` に追記するのみで実 API 不発火。

詳細は phase-02.md §architecture / `infra/cloudflare-alerts/lib/api-client.ts` を参照。
