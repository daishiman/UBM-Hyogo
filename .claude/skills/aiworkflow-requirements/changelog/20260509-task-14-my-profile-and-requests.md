# 2026-05-09 task-14 my-profile-and-requests

## Summary

- workflow root: `docs/30-workflows/task-14-my-profile-and-requests/`
- state: `IMPLEMENTED_LOCAL_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / runtime_pending`
- scope: `/profile` four-region member page rebuild implementation specification
- synced artifacts: Phase 1-13, root/output `artifacts.json` parity, Phase 12 strict seven files
- canonical contract: existing `/me` self-service API consumption only, no `apps/api/src/routes/me/*` or `apps/web/app/api/me/*` changes, `fetchAuthed("/me/*")` component call strings, no direct D1 access, OKLch token-only styling. Dialog pure UI split is a design target and is not claimed as completed in this local wave.
- selectors: `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog`
- dependencies: task-09, task-10, task-13
- downstream: task-18 regression smoke / verify-design-tokens
- boundary: apps/web implementation is reflected locally; visual/runtime evidence, staging deploy, production smoke, commit, push, and PR remain user-gated

## Review Fixes

| Area | Fix |
| --- | --- |
| task-specification-creator compliance | Added root artifacts, output mirror, phase ledgers, and Phase 12 strict seven |
| API path contract | Normalized component calls to `fetchAuthed("/me/*")`; `/api/me/*` is proxy implementation only |
| Dialog ownership | Corrected over-claim: current local dialogs still own submit side effects, so pure UI split is documented as a limitation |
| DoD numbering | Added G-14-10 Sentry smoke and removed stale higher-number DoD references |
| task-18 contract | Fixed five `data-region` selectors |
| aiworkflow sync | Added resource-map, quick-reference, task-workflow-active, artifact inventory, changelog, and LOGS entry |

## Promotion Path

Current canonical root remains active at `docs/30-workflows/task-14-my-profile-and-requests/`.
After runtime evidence, commit, push, and PR completion, promote according to completed-tasks policy.
