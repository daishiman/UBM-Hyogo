# 2026-05-17 — issue-769-root-error-focus sync

Issue #769 root `apps/web/app/error.tsx` h1 auto-focus was synchronized as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

## Same-wave updates

- `apps/web/app/error.tsx`: added h1 ref, `tabIndex={-1}`, and `focus({ preventScroll: true })` after `logger.error`.
- `apps/web/app/__tests__/error.component.spec.tsx`: added TC-U-09 focus transfer coverage.
- `docs/30-workflows/issue-769-root-error-focus/`: added root/output artifacts, Phase 11 evidence ledger, Phase 12 strict 7, and Phase 13 PR summary.
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`: updated i06 to local implementation complete.
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md`: marked consumed by issue-769 local implementation.
- `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`, `references/workflow-issue-769-root-error-focus-artifact-inventory.md`, and `LOGS/_legacy.md`: registered current workflow.
- `lessons-learned/lessons-learned-issue-769-root-error-focus-2026-05.md`: recorded L-I769-001..005 (h1 ref + tabIndex={-1} + focus({ preventScroll: true }) pattern, existing-test discovery, Phase 12 strict 7 for small NON_VISUAL tasks, parent / unassigned same-wave sync, a11y user-gate boundary).

## Boundary

Interactive screen reader smoke, commit, push, and PR remain user-gated.
