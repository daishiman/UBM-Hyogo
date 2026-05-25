# Phase 8: 品質ゲート

| Gate | Command / Evidence | Status |
| --- | --- | --- |
| G1 focused Vitest | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/security-headers.spec.ts apps/web/__tests__/middleware.spec.ts` | PASS |
| G2 unsafe-inline grep | `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts` | PASS (0 hit) |
| G3 Playwright HTTP smoke | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/security-headers.spec.ts --project=desktop-chromium` | PASS |
| G4 Phase 11 manifest | `outputs/phase-11/canonical-paths.json` + evidence files | PASS |
| G5 Phase 12 strict 7 | `outputs/phase-12/*` | PASS |
| G6 aiworkflow sync | security header spec / artifact inventory / indexes / changelog | PASS |
| G7 staging/production verification | Phase 13 user gate | pending_user_approval |
| G8 commit/push/PR | Phase 13 user gate | pending_user_approval |

Local quality gate is PASS. External runtime gate remains pending by policy.
