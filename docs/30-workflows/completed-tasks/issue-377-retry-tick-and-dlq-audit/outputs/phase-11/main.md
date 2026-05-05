# Phase 11 Evidence

## Status

PASS: local focused NON_VISUAL evidence captured.

## Evidence

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/api/src/workflows/tagQueueRetryTick.test.ts` | PASS: 7 tests |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/api lint` | PASS |
| `pnpm --filter @ubm-hyogo/api test` | Broad run exposed Miniflare D1 environment exhaustion / long-run hook timeout; Issue #377 focused suite PASS and the two timeout files PASS on focused rerun |

## Notes

- A broad API test run can exhaust local Miniflare D1 proxy ports when run in parallel. Serial broad run reduced that to two unrelated hook timeouts; both failed files passed on focused rerun.
- Deploy, Cloudflare tail, and production runtime audit observation remain Phase 13/user-approved runtime actions.
