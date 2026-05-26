# Manual test result

## Summary

Local automated visual smoke covers the Phase 11 screen evidence for `/register`.
Manual-only browser checks remain user-gated because commit / PR / staging operations are outside this cycle.

Execution result on 2026-05-26:

- `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/register-page-prototype-alignment/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test register-prototype-alignment.spec.ts --project=desktop-chromium`
- Result: 1 passed
- axe summary: `criticalCount=0`, `violationCount=9`

## Covered scenarios

| Scenario | Evidence |
| --- | --- |
| S1 5セクション存在 | `apps/web/playwright/tests/register-prototype-alignment.spec.ts` |
| S2 Hero CTA target/rel | `apps/web/playwright/tests/register-prototype-alignment.spec.ts` |
| S3 Bottom CTA presence | `apps/web/playwright/tests/register-prototype-alignment.spec.ts` |
| S6/S7 details semantics | component specs + native `<details>` rendering |
| S11 mobile width | `outputs/phase-11/screenshots/register-mobile.png` |

## Expected generated files

- `outputs/phase-11/screenshots/register-desktop.png` (1280 x 2239)
- `outputs/phase-11/screenshots/register-mobile.png` (390 x 3016)
- `outputs/phase-11/evidence/axe-results.json`
- `outputs/phase-11/evidence/playwright-report/results.json`
