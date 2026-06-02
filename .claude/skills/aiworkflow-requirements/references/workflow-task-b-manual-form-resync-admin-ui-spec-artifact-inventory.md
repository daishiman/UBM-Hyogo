# Workflow Artifact Inventory: task-b-manual-form-resync-admin-ui-spec

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` |
| root artifacts | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-11/main.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` |
| parent Task B source | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/B-manual-form-resync-admin-ui.md` |
| implementation targets | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`, `apps/web/src/features/admin/diagnostics/manual-sync.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/lib/env.ts` |

## Status

`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / runtime_visual_pending_user_gate`.

The implementation landed in commit `745c95115` / PR #1064. This workflow is the standalone Phase 1-13 canonical spec and local evidence package for Task B.

## Evidence

- `outputs/phase-11/evidence/focused-vitest.log`: focused Task B panel/schema/proxy tests PASS.
- `outputs/phase-11/evidence/typecheck.log`: `@ubm-hyogo/web` typecheck PASS.
- `outputs/phase-11/evidence/lint.log`: `@ubm-hyogo/web` lint PASS.
- `outputs/phase-12/`: strict 7 files present.
- Root and output `artifacts.json` use the same canonical workflow state.

## User-Gated

`SYNC_ADMIN_TOKEN` secret injection, authenticated runtime screenshots, commit, push, PR, and deploy require explicit user approval.
