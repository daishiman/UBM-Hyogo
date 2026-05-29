# 2026-05-28 issue-976-admin-fetch-service-binding

`issue-976-admin-fetch-service-binding` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。`apps/web/src/lib/admin/server-fetch.ts` の admin fetch transport を `API_SERVICE` service-binding 優先へ変更し、test/Playwright runtime は HTTP fallback を維持。focused Vitest 3 files / 9 tests PASS。staging deploy、authenticated `/admin/meetings` runtime evidence、`wrangler tail`、commit、push、PR は user-gated。
