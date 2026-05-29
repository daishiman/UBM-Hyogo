# 2026-05-28 fix-admin-fetch-cf-1042-service-binding

`fix-admin-fetch-cf-1042-service-binding` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。

- `fetchAdmin` を Cloudflare Workers runtime で `API_SERVICE.fetch()` first に変更し、同一 account raw HTTP loopback の `error code: 1042` を回避。
- `getAdminFetchEnv()` を追加し、test/Playwright の explicit `INTERNAL_API_BASE_URL` HTTP fallback を維持。
- Service Binding / HTTP fallback / URL / env regression tests を追加・更新。
- Phase 11 local evidence、Phase 12 strict 7、root/output artifacts parity、quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave 反映。
- staging deploy、authenticated `/admin` smoke、wrangler tail、commit、push、PR は user-gated。
