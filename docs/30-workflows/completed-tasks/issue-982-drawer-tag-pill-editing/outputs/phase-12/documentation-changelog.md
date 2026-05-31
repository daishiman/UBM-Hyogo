# Documentation changelog

Date: 2026-05-29

## Workflow-local

- Created strict 7 Phase 12 outputs for `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/`.
- Replaced Phase 10 "MINOR to unassigned" wording with explicit scope-out classification and same-cycle no-escape language.
- Tightened artifacts parity: root `artifacts.json` and `outputs/artifacts.json` are mirrored exactly.

## aiworkflow-requirements

- Registered Issue #982 workflow in quick reference, resource map, task workflow active ledger, artifact inventory, and changelog.
- Promoted Issue #982 from spec-created target to `implemented_local_runtime_pending` after same-cycle code execution.
- Updated current API references for `GET/POST /admin/members/:memberId/tags` and `DELETE /admin/members/:memberId/tags/:tagId`, including active-tag-only POST and 204 No Content DELETE behavior.

## task-specification-creator

- No template change required. The local workflow now follows existing strict 7, state vocabulary, Phase 12 parity, and VISUAL_ON_EXECUTION boundary rules.

## automation-30 review fixes

- Fixed `useAdminMutation` DELETE 204 handling so successful no-body responses do not rollback optimistic UI.
- Fixed inactive tag assignment by requiring `tag_definitions.active = 1` during POST validation.
- Added focused regression tests for both boundaries and updated local evidence counts.
