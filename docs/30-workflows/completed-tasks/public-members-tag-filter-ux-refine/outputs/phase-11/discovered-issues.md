# Discovered Issues

## Current Cycle

| Issue | Status | Resolution |
| --- | --- | --- |
| `spec_created` wording conflicted with local `apps/web` diff | resolved | Workflow state synchronized to `implemented_local_runtime_pending` |
| Root `pnpm verify:design-tokens` command did not exist | resolved | Use `pnpm verify:tokens`; web package script remains `pnpm --filter @ubm-hyogo/web verify-design-tokens` |
| Phase 11 VISUAL helper outputs were missing | resolved | Added manual result/report, discovered issues, visual review, screenshot plan, capture metadata, and screenshots directory |

## Open Runtime Items

| Item | Status | Gate |
| --- | --- | --- |
| Staging visual screenshots | pending | user approval after deploy |
| Commit / push / PR | pending | explicit user approval |
