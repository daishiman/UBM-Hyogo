# Phase 12 Main: task-13-login-rebuild

## Summary

This Phase 12 cycle normalizes `docs/30-workflows/task-13-login-rebuild/` as `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`.

## Executed Changes

- Added root/output `artifacts.json` parity.
- Reclassified the workflow from `spec_created` to `implemented-local` because `apps/web` code and tests are present in this branch.
- Added Phase 12 strict 7 outputs.
- Added `verify-design-tokens` script to `@ubm-hyogo/web`.
- Fixed package command drift from stale `web` filter to `@ubm-hyogo/web`.
- Fixed locator contract by requiring `data-testid="login-card"` plus `data-state`.
- Fixed `LoginCardProps.state` ownership.
- Fixed Magic Link failure to transition via URL query `state=error`.
- Fixed long `error` query handling to truncate to 200 characters instead of invalidating the whole query.
- Added Playwright screenshot capture to `outputs/phase-11/login-*.png`.
- Fixed `rules_declined` a11y role to `alert` to match the member screen blueprint.
- Rewrote Phase 13 as a user-gated PR preparation phase.
- Synced aiworkflow-requirements quick reference, resource map, active workflow table, changelog, and LOGS.

## Runtime Boundary

`apps/web` implementation and local verification are claimed in this Phase 12 cycle. Staging smoke, production-equivalent runtime evidence, commit, push, and PR remain pending user approval.

## Validation Targets

- `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/task-13-login-rebuild`
- `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/task-13-login-rebuild`
- `cmp -s docs/30-workflows/task-13-login-rebuild/artifacts.json docs/30-workflows/task-13-login-rebuild/outputs/artifacts.json`
- `git status --short`
- `git diff --stat`
