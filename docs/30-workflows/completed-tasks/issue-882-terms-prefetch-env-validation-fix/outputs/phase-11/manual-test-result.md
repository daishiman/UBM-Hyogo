# Phase 11 Manual Test Result — issue-882-terms-prefetch-env-validation-fix

## Summary

| Item | Result |
| --- | --- |
| Date | 2026-05-25 |
| Classification | NON_VISUAL runtime smoke |
| Verdict | PASS |

## Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web test -- src/lib/__tests__/env.spec.ts src/lib/seo/__tests__/site-metadata.spec.ts` | PASS | Repo script expanded to full `apps/web` Vitest: 146 files passed, 1030 tests passed, 1 skipped |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS | `tsc -p tsconfig.json --noEmit` |
| `pnpm --filter @ubm-hyogo/web lint` | PASS | typecheck + eslint |
| `PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/terms-prefetch.spec.ts --project=desktop-chromium` | PASS | 1 test passed. Required `node scripts/e2e-mock-api.mjs` on `127.0.0.1:8787` because `/` server data fetches public stats/members. |

## Runtime Smoke Result

The Playwright smoke opened `/`, waited for network idle, hovered the `利用規約` link, and asserted:

- console/page errors: 0
- `/terms` responses with status >= 400: 0

## Boundary

The first Playwright attempt failed before test execution because port `3000` was already in use. The second attempt used `3100` but failed because the deterministic mock API was not running; `/` entered the existing error boundary from `ECONNREFUSED 127.0.0.1:8787`. After starting `node scripts/e2e-mock-api.mjs`, the same smoke passed. This is recorded as a local runtime prerequisite, not an application regression.
