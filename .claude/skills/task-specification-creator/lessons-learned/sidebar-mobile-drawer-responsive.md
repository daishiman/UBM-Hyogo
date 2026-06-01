# Lesson — Sidebar mobile drawer responsive

## Context

Issue #1016 Task E was initially represented as `implementation / VISUAL` but closed as `spec_created` with concrete implementation targets listed. automation-30 review applied the Implementation Target Physical Existence Gate and reclassified the workflow to `implemented_local_runtime_pending`.

## Lesson

- If a workflow lists concrete `apps/` implementation targets and the implementation is feasible in the current cycle, do not close with spec-only prose.
- Pre-existing state / prop surfaces such as `drawerOpen` and `mobileTriggerSlot` should be checked for consumption sites. If state exists without a consumer, the follow-up task should implement the consumer rather than create another backlog item.
- For client-only responsive helpers, prefer adding a small helper to the existing browser boundary module over local `window.*` calls in feature components.
- For VISUAL tasks, focused component tests can satisfy Gate-B while local screenshots and staging visual should be tracked separately. The workflow state should distinguish `focused tests present`, `local screenshot present`, and `staging visual pending`.

## Evidence

- Workflow: `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/`
- Evidence: `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-11/evidence/focused-vitest.log` and `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-11/screenshots/`
- aiworkflow inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-1016-sidebar-mobile-drawer-responsive-artifact-inventory.md`
