# 2026-05-16 UT-17-FU-005 alert-relay KV error metrics

UT-17-FU-005 was synchronized as `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`.

- Implemented structured JSON warn logging for `ALERT_DEDUP_KV.get` / `put` failures in `apps/api/src/routes/internal/alert-relay.ts`.
- Added `isolateId`, `dedupeKeyHash` (SHA-256 first 12 hex chars), and fixed `event: "alert_relay_kv_op_failed"`.
- Changed `KV.get` failure path from unhandled 500 to fail-open after logging; `KV.put` preserves `dedupPersisted: false`.
- Added Vitest coverage in `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`.
- Added runbook Step 4c in `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`.
- Added workflow root/output artifacts parity, Phase 11 evidence summaries, Phase 12 strict 7 compliance, and artifact inventory.
- Local verification passed: `mise exec -- pnpm typecheck`, `mise exec -- pnpm lint`, and `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`.
- Commit / push / PR / staging deploy / production deploy / Workers Logs runtime tail evidence remain user-gated.
