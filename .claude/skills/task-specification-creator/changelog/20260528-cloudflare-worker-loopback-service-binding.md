# 2026-05-28 Cloudflare Worker loopback Service Binding lesson

`fix-admin-fetch-cf-1042-service-binding` の automation-30 改善を反映。

- Worker-to-Worker raw HTTP loopback 404 / `error code: 1042` は Service Binding first transport を第一候補にする。
- implementation target が明確な workflow は仕様書だけで閉じず、同一 wave で `apps/` 実装・focused tests・Phase 11 evidence boundary・Phase 12 strict 7 を揃える。
- staging deploy / authenticated smoke / wrangler tail / commit / push / PR は user-gated として分離する。
