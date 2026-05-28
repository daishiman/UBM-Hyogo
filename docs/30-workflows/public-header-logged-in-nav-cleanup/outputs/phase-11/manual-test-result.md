# Phase 11 — Manual / Runtime Evidence

Status: `runtime_pending`

No apps/web implementation was performed in this spec-improvement wave. Required runtime evidence after implementation:

| Evidence | Command / action | Expected |
| --- | --- | --- |
| Focused local specs | See `artifacts.json.metadata.verify_commands` | all green |
| Playwright auth slot | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=auth-slot-coverage` | 21 route/state checks pass |
| Staging smoke | authenticated guest/member/admin visits to `/`, `/privacy`, `/terms`, `/profile`, `/admin` | DOM `data-auth-state` matches session |

This file is intentionally not PASS. It is a pending ledger for the implementation wave.
