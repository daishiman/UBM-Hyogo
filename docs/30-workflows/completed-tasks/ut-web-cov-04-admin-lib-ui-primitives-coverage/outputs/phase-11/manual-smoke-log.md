# Manual Smoke Log: ut-web-cov-04-admin-lib-ui-primitives-coverage

Status: PASS.

| Step | Command / Check | Result |
| --- | --- | --- |
| 1 | `mise exec -- pnpm --filter @app/web test` | FAIL: no matching package. Correct package is `@ubm-hyogo/web`. |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | PASS: 44 test files / 322 tests. Initial stale `AdminSidebar` 7-link assertion was corrected to current 8-link navigation. |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | PASS: 44 test files / 322 tests; coverage summary generated at `apps/web/coverage/coverage-summary.json`. |
| 4 | Phase 11 coverage extraction | PASS: 13 target rows populated in `coverage-after.json` and `coverage-diff.md`. |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` / `build` | PASS. Build emitted only the existing Next.js middleware deprecation warning. |
| 6 | Visual evidence judgment / secret hygiene | PASS: NON_VISUAL, screenshots not required; no `.env` content or secret values copied into evidence. |
