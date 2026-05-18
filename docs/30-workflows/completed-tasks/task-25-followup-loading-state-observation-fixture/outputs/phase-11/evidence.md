# Phase 11 Evidence

## Verdict

`local_runtime_evidence_captured (staging deployment and CI evidence remain user-gated)`

## Scope

This NON_VISUAL implementation adds deterministic runtime observation for the `loading.tsx` surface by using `/smoke/loading-state`.

## Evidence Files

| Evidence | Status | Notes |
| --- | --- | --- |
| `apps/web/app/__smoke__/_lib/fixture-guard.ts` | captured | Shared `ENABLE_STAGING_SMOKE_FIXTURE === "1"` and `ENVIRONMENT !== "production"` guard. |
| `apps/web/app/__smoke__/loading-state/page.tsx` | captured | Private server component delay fixture with 0-3000 ms clamp. |
| `apps/web/app/__smoke__/loading-state/loading.tsx` | captured | Private App Router loading boundary with `role="status"` and `aria-live="polite"`. |
| `apps/web/app/smoke/loading-state/page.tsx` | captured | Routable wrapper for `/smoke/loading-state`. |
| `apps/web/app/smoke/loading-state/loading.tsx` | captured | Routable loading wrapper for `/smoke/loading-state`. |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | captured | Loading state fixture tests added to existing staging smoke suite. |
| `SMOKE-COVERAGE-MATRIX.md` | captured | Row 19 changed from `N/A-runtime-observation` to fixture runtime observation. |

## Runtime Boundary

Full staging deployment smoke and GitHub Actions evidence are intentionally user-gated with commit / push / PR. Local focused Playwright verification was captured against `http://localhost:3000` with `ENABLE_STAGING_SMOKE_FIXTURE=1`.

| Command | Result |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web test -- app/__smoke__/_lib/fixture-guard.spec.ts` | pass: apps/web Vitest 589 passed / 1 skipped; focused fixture guard spec 4 passed |
| `ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging STAGING_BASE_URL=http://localhost:3000 pnpm --dir apps/web exec playwright test tests/e2e/staging-smoke.spec.ts --config playwright.config.ts --project=staging-smoke --grep "staging smoke / loading state" --reporter=list` | pass: 5 passed |
| `ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging STAGING_BASE_URL=http://localhost:3000 pnpm --dir apps/web exec playwright test tests/e2e/staging-smoke.spec.ts --config playwright.config.ts --project=staging-smoke --grep "staging smoke / loading state" --repeat-each=10 --reporter=list` | pass: 50 passed (11.6m) |

## Guard Coverage

`apps/web/app/__smoke__/_lib/fixture-guard.spec.ts` covers:

- enabled only when `ENABLE_STAGING_SMOKE_FIXTURE=1` and `ENVIRONMENT=staging`
- disabled when the flag is absent
- disabled when `ENVIRONMENT=production`
- local Playwright fallback through `process.env` when OpenNext Cloudflare env is unavailable
