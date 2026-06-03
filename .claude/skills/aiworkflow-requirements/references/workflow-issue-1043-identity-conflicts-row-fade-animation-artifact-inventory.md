# Workflow Artifact Inventory: issue-1043-identity-conflicts-row-fade-animation

| Artifact | Purpose |
| --- | --- |
| `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/` | canonical workflow root |
| `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/artifacts.json` | root metadata |
| `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/artifacts.json` | output mirror |
| `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-11/manual-test-result.md` | local evidence and screenshot boundary |
| `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |

## Implementation Surface

| Path | Change |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | adds merge exiting state, fallback timer, `transitionend` removal, rollback timer cleanup, and reduced-motion aware immediate fallback |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | updates optimistic-hide assertions to exiting/removed semantics and covers transitionend, fallback timer, reduced-motion, success, rollback, and dismiss invariants |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | updates merge and rollback expectations to use exiting/removed/rollback-restored screenshot names and stable row-panel state |

## Evidence

- focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` -> 1 file / 13 tests PASS.
- web typecheck: `pnpm --filter @ubm-hyogo/web typecheck` -> PASS.
- web lint: `pnpm --filter @ubm-hyogo/web lint` -> PASS.
- local Playwright: `ADMIN_IDENTITY_CONFLICTS_EVIDENCE=1 PLAYWRIGHT_ISSUE1043_SCREENSHOT_DIR=../../docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-11/screenshots pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-identity-conflicts.spec.ts` -> 8/8 PASS.
- screenshots: `outputs/phase-11/screenshots/identity-conflict-row-exiting-fade.png`, `identity-conflict-row-removed-stable.png`, `identity-conflict-row-rollback-restored.png` -> captured.

## Runtime Boundary

Local fixture screenshots are captured. Commit, push, PR, and Issue #1043 mutation remain user-gated. API endpoints, D1 schema, `useAdminMutation`, design tokens, `globals.css`, and dismiss behavior remain unchanged.

## Placement

- Workflow root resides at `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/` (active workflow, not moved to `completed-tasks/`; close-out move is a separate user-gated step).
- Source unassigned spec is retained at `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md` (not consumed/moved).
- GitHub Issue #1043 is `CLOSED` on GitHub (closed 2026-06-01); no Issue mutation was performed by this workflow.

## Lessons Learned

- **L-I1043-001**: For optimistic UI exit motion, separate `exiting` from `removed`; setting removed immediately makes fade unobservable and breaks rollback clarity.
- **L-I1043-002**: `transitionend` must be paired with a timeout fallback because jsdom and reduced-motion paths may not fire real CSS transition events.
- **L-I1043-003**: Browser APIs in client components must enter through `browserWindow()` / `is-browser` helpers; bare `window` fails the web lint gate.
- **L-I1043-004**: Fake-timer fallback tests for the `removed` transition must wrap `vi.runOnlyPendingTimersAsync()` in `await act(async () => { ... })`; the timer callback's `setOptimisticMerged(true)` is a React state update and asserting synchronously right after the timer (outside `act`) leaves it un-flushed, so the row appears to remain and the test FAILs. Import `act` from `@testing-library/react`.
- **L-I1043-005**: The web `lint` gate scopes only `apps/web/src/**`, so dead code in `apps/web/playwright/**` (e.g. an unused `const rowPanel` in the rollback spec) is not caught by lint; remove such dead declarations by inspection rather than relying on the gate.
- **L-I1043-006 (process)**: A read-only audit `Explore` SubAgent can still run `mv`/rewrite scripts via `Bash`; in this session it prematurely close-out-moved the workflow dir to `completed-tasks/` and rewrote `issue_state`/paths across index/artifacts/skill files. Recovery: revert dir moves, restore tracked unassigned source via `git restore`, and reverse the `completed-tasks/<dir>` path rewrites back to the active location. Verify with a residual `grep -rl "completed-tasks/<dir>"` count of 0 and root↔outputs `artifacts.json` byte parity.
