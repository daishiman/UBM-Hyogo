# 2026-05-12 task-18 W7 verify tokens and Playwright smoke

## Summary

Synchronized the task-18 W7 implementation-local regression gate as `implemented-local / implementation / NON_VISUAL / runtime_pending`.

## Canonical workflow

- `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/`

## Canonical contracts

- Token drift gate: `scripts/verify-design-tokens.ts` compares `09b-design-tokens.md` §9, `apps/web/src/styles/tokens.css`, and `apps/web/src/styles/globals.css` `@theme inline`.
- Playwright smoke: `apps/web/playwright/tests/full-smoke.spec.ts` covers 17 URL routes (public 6 / member 2 / admin 8 / not-found 1).
- Visual baseline: `apps/web/playwright/tests/visual/*.spec.ts` covers `/login`, `/`, `/admin`, and `/profile`.
- Required status check candidates:
  - `verify-design-tokens / verify-design-tokens`
  - `playwright-smoke / smoke (chromium)`
  - `playwright-smoke / visual (chromium, 4 screens)`

## Evidence Boundary

Phase 11 evidence must use tracked `.txt` / `.json` files. `.log` files are ignored by repository `.gitignore` and must not be used as PASS evidence.

Commit, push, PR creation, and branch protection PUT remain user-gated.

## After-sync regression fixes (2026-05-13)

Local merge of `origin/dev` (sync after the initial implementation) surfaced 5 CI failures. All were resolved on the same task-18 branch:

1. `verify-indexes-up-to-date`: `indexes/keywords.json` merge conflict resolved with `--theirs` did not include branch-side additions. Rebuilt via `pnpm indexes:rebuild` and committed regenerated indexes.
2. `verify-phase12-compliance` (parent `completed-tasks/` root): stray follow-up spec `task-18-full-visual-regression-suite-001.md` at completed-tasks/ root was relocated to `docs/30-workflows/unassigned-task/` to avoid orphan workflow root detection.
3. `verify-phase12-compliance` (task-18 root): `outputs/phase-12/phase12-task-spec-compliance-check.md` rewritten to satisfy the 9 canonical headings required by the CI grep gate (see L-TASK18-W7-009).
4. `verify-gate-metadata`: `metadata.gates` (Gate-A..D) added to both `artifacts.json` files identically (see L-TASK18-W7-008).
5. `playwright-smoke / smoke` and `visual (4 screens)`:
   - `apps/web/playwright.config.ts:52` and `apps/web/playwright/fixtures/auth.ts:399` switched URL fallback from `??` to `||` so empty env strings fall back correctly (L-TASK18-W7-006).
   - `desktop-chromium` / `desktop-firefox` / `mobile-webkit` projects now `testIgnore` `visual/*.spec.ts` and `full-smoke.spec.ts` (L-TASK18-W7-007).
   - Visual baselines `apps/web/playwright/tests/visual/<spec>.spec.ts-snapshots/<name>-visual-chromium-linux.png` committed for `admin-dashboard`, `login`, `profile`, `public-top` (4 screens) sourced from CI `playwright-visual-artifacts/*-actual.png`.

CI on head `c5e36dac`: `playwright-smoke / smoke (chromium)` and `playwright-smoke / visual (chromium, 4 screens)` both ✅ success. `e2e-tests-coverage-gate` remains failing due to pre-existing a11y violations and admin-* spec timeouts that are out of task-18 scope.
