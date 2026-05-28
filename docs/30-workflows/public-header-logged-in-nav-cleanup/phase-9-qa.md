# Phase 9 — QA

## Gates

| Gate | Command | Status in this wave |
| --- | --- | --- |
| TypeScript | `mise exec -- pnpm typecheck` | pending implementation |
| Lint | `mise exec -- pnpm lint` | pending implementation |
| Focused Vitest | command listed in `artifacts.json.metadata.verify_commands` | pending implementation |
| Playwright auth slot | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=auth-slot-coverage` | pending implementation |
| Strict Phase 12 | file existence + root/output artifacts parity | completed for spec wave |

## Runtime Boundary

This workflow is `spec_created`. QA for code/runtime must run after Task A-F implementation lands. This document prevents false green by keeping runtime evidence pending instead of predicting PASS.
