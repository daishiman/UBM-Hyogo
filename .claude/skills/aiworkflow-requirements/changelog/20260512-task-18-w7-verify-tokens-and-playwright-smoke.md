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
