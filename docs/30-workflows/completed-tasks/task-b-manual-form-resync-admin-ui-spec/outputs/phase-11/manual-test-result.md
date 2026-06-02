# Phase 11 Manual Test Result

## Summary

Status: `implemented_local_evidence_captured / runtime_visual_pending_user_gate`.

Focused tests and typecheck passed locally for the landed Task B implementation. Runtime screenshot capture is pending because it requires authenticated admin browser state and deployed `SYNC_ADMIN_TOKEN` configuration.

## Automated Evidence

| Command | Evidence | Result |
|---|---|---|
| `pnpm exec vitest run apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts 'apps/web/app/api/admin/[...path]/route.spec.ts'` | `evidence/focused-vitest.log` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | `evidence/typecheck.log` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | `evidence/lint.log` | PASS |

## Test Coverage Mapping

| Area | Cases |
|---|---|
| Panel behavior | TC-B1..TC-B8: differential sync, full backfill confirm, cancel, pending disabled, 409 in-progress, HTTP error, schema mismatch, callback |
| Schema behavior | TC-S1..TC-S7: `SyncResultSchema` / `SyncRunResponseSchema` accept/reject cases |
| Proxy boundary | route spec: sync bearer injection, missing token fail-fast, non-sync authorization preservation |

## Runtime Visual

Pending. Required screenshots are listed in `screenshot-plan.json`; capture is user-gated.
