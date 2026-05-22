# 2026-05-16 UT-17-FU-005 Alert Relay KV Operation Error Metrics

Synchronized UT-17-FU-005 as `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.

## Summary

- Added fail-safe structured KV operation error logging to `apps/api/src/routes/internal/alert-relay.ts`.
- `KV.get` failure now emits `alert_relay_kv_op_failed` and continues Slack delivery.
- `KV.put` failure now emits the same structured event and preserves `dedupPersisted:false`.
- `dedupeKeyHash` is SHA-256 first 12 hex; hash failure emits `hash_error` without rethrow.
- Expanded `alert-relay.spec.ts` coverage and updated the monthly healthcheck runbook.

## Evidence

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api lint`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api build`: PASS
- `ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay`: PASS, 48 files / 294 tests
