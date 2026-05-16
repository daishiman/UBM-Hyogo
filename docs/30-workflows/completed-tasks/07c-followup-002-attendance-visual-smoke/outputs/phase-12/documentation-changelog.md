# Phase 12: documentation-changelog

[実装区分: 実装仕様書]

## Change record

| Area | Change |
| --- | --- |
| Workflow root | Added `artifacts.json` and `outputs/artifacts.json` parity ledgers. |
| Phase 12 | Replaced short PASS-style compliance with canonical 9-heading compliance check. |
| Runtime state | Reclassified workflow as `implemented_local_completed / VISUAL_ON_EXECUTION` after same-wave code implementation. |
| Playwright | Added attendance 4-case visual smoke, page object helpers, mock meetings endpoints, and fixture seed SSOT. |
| UI | Added stable `data-testid` attributes to attendance list controls without visual styling changes. |
| API surface | Replaced stale singular `/attendance` detail POST with existing `/attendances` POST body contract. |
| API surface | Added missing `GET /admin/meetings/:id` detail read route to match the existing Web detail page dependency. |
| CI workflow | Added focused attendance visual smoke step to `.github/workflows/playwright-smoke.yml`; Actions result remains user-gated until commit / push / PR. |
| Phase 6-9 | Reconciled optional expansion/coverage/selector gates so mandatory evidence matches the implemented AC-1 to AC-4 visual smoke scope. |
| aiworkflow-requirements | Added quick-reference, resource-map, task-workflow-active, changelog, and artifact inventory entries. |

## Validator execution log

| Command | Expected |
| --- | --- |
| `cmp -s artifacts.json outputs/artifacts.json` | exit 0 |
| `pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false` | exit 0 |
| `pnpm exec tsx scripts/verify-phase12-compliance.ts` | exit 0 |
| `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium` | exit 0 |

## Issue wording

Issue #313 is referenced with `Refs #313`. `Closes` / `Fixes` / `Resolves` are not used.
