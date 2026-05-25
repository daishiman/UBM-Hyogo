# Phase 11 manual-test-result

Status: `implemented_local_evidence_captured`.

Runtime verification was executed locally on 2026-05-25 JST after adding
`apps/web/app/(public)/error.tsx`, `loading.tsx`,
`error-boundary-smoke/page.tsx`, and the Playwright smoke spec.

| TC-ID | Evidence | Status | Notes |
| --- | --- | --- | --- |
| TC-01 | `outputs/phase-11/screenshots/public-error-boundary.png` | PASS | `(public)/error.tsx` rendered under `data-route-group="public"` |
| TC-02 | Playwright focus assertion | PASS | `document.activeElement` is `h1` after boundary mount |
| TC-03 | production guard source check | PASS | `error-boundary-smoke/page.tsx` calls `notFound()` when `NODE_ENV === "production"` |

## Commands executed

```bash
pnpm --filter @ubm-hyogo/web exec playwright install chromium
ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 PLAYWRIGHT_TEST=1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://localhost:3000 AUTH_SECRET=playwright-e2e-auth-secret-32-bytes PORT=3000 pnpm --filter @ubm-hyogo/web dev:webpack
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/issue-880-public-segment-error-loading-boundary/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts --project=desktop-chromium
```

Result: `2 passed (7.8s)`.

## Runtime notes

The normal Playwright `webServer` path timed out while waiting for the local
Next.js server to answer the ready URL. The same server command succeeded when
started manually with the Playwright env, then the spec passed with
`PLAYWRIGHT_SKIP_WEB_SERVER=1`.
