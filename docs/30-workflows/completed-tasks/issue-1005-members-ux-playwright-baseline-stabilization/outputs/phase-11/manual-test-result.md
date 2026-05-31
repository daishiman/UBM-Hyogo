<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 11 -->

# Phase 11 Manual Test Result — issue-1005-members-ux-playwright-baseline-stabilization

## 1. Summary

Status: PASS.

`apps/web/playwright/tests/members-ux-clarity.spec.ts` was executed against local Next dev after an explicit cold-start `/members` warm-up. The run produced the expected 24 PNG files in the completed parent workflow evidence directory and did not recreate the stale active workflow path.

## 2. Commands

```bash
pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false
pnpm --filter @ubm-hyogo/web lint
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3105 PLAYWRIGHT_EVIDENCE_TASK=members-ux-clarity-baseline pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=desktop-chromium
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' | wc -l
test ! -d docs/30-workflows/members-list-ux-clarity && echo OK
```

## 3. Results

| Check | Result |
| --- | --- |
| TypeScript | PASS (`tsc --noEmit`) |
| Web lint | PASS (`pnpm --filter @ubm-hyogo/web lint`) |
| Cold-start `/members` warm-up | PASS (`CI=1`, fresh Next dev on `localhost:3105`, webServer ready URL `/members`, timeout 180s) |
| Playwright | PASS (`12 passed`, 1 worker, desktop-chromium) |
| PNG count | PASS (`24`) |
| Stale active path | PASS (`docs/30-workflows/members-list-ux-clarity` not created) |
| Mobile filter expansion | PASS (click waits for `data-expanded=true`; cold-start hydration fallback keeps visual capture deterministic) |

## 4. Evidence Paths

| Evidence | Path |
| --- | --- |
| Screenshots | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots/` |
| Runtime notes | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/runtime-notes.md` |
| Console summary | `12 passed (4.0m)` from cold-start local Playwright run |

## 5. Boundary

Commit, push, PR creation, staging visual baseline refresh, and GitHub Issue #1005 state changes remain user-gated.
