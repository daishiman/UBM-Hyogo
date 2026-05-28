# Phase 11 Manual / Runtime Test Result

task_id: `members-list-prototype-alignment`
date: 2026-05-26

## Verdict

`PARTIAL`: local unit/typecheck evidence is green. Playwright visual runtime did not reach the test body in the latest rerun because Playwright `webServer` timed out waiting 120000ms for the local Next.js ready URL.

## Evidence

| command | result | notes |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS | `tsc -p tsconfig.json --noEmit` completed with exit 0 |
| `pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState` | PASS | Repo script executed broad web suite: 157 files / 1146 tests passed, 1 skipped |
| `pnpm --filter @ubm-hyogo/web exec playwright install chromium` | PASS | Chromium and headless shell installed locally |
| `PLAYWRIGHT_EVIDENCE_TASK=members-list-prototype-alignment pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-prototype-alignment.spec.ts --project=desktop-chromium` | FAIL | `Timed out waiting 120000ms from config.webServer`; test body did not start |
| `PLAYWRIGHT_EVIDENCE_TASK=members-list-prototype-alignment PLAYWRIGHT_BASE_URL=http://localhost:3002 pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-prototype-alignment.spec.ts --project=desktop-chromium` | FAIL | same `config.webServer` timeout on alternate port |

## Runtime Boundary

The Playwright spec and config were corrected from the stale `members-page-prototype-alignment` path to the current `members-list-prototype-alignment` path, and the list-density assertion now targets `MemberGrid` instead of the retired `MemberTable` route branch. Remaining failure is local webServer readiness, not a TypeScript or component contract failure.
