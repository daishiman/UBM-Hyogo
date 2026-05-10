# 2026-05-09 task-13 login rebuild implemented-local sync

## Summary

- workflow root: `docs/30-workflows/task-13-login-rebuild/`
- state: `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- scope: `/login` rebuild specification for 5 core states + `rules_declined` derived state + `gate=admin_required` overlay
- synced artifacts: Phase 1-13, Phase 11 local screenshots, Phase 12 strict 7 files, Phase 13 readiness checklist, root/output `artifacts.json` parity
- canonical contract: `data-testid="login-card"` + `data-state`, `LoginCardProps.state`, `rules_declined role="alert"`, Auth.js + Magic Link API surface unchanged, no D1 direct access from `apps/web`, OKLch token-only styling
- dependencies: task-09, task-10
- downstream: task-18 regression smoke / verify-design-tokens
- boundary: apps/web implementation, focused tests, and local Playwright screenshots are reflected in this branch. staging smoke, production-equivalent runtime evidence, commit, push, and PR remain user-gated

## Corrections Applied

| Area | Correction |
| --- | --- |
| Phase 12 | Added strict 7 outputs and compliance check |
| artifacts | Added root/output parity |
| state vocabulary | Reclassified from `spec_created` to `implemented-local` because app code is present |
| locator | Added `data-testid="login-card"` to Phase 3/5/6/9 |
| props | Fixed `LoginCardProps.state` ownership |
| a11y | Aligned `rules_declined` to `role="alert"` |
| commands | Replaced stale `web` filter with `@ubm-hyogo/web` |
| script contract | Added `@ubm-hyogo/web verify-design-tokens` |
| URL state | Fixed Magic Link failure to transition to `state=error` via URL query |
| visual evidence | Added local Playwright screenshot capture under `outputs/phase-11/` |
| Phase 13 | Reframed as user-gated PR preparation |

## Related References

- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/workflow-task-13-login-rebuild-artifact-inventory.md`
