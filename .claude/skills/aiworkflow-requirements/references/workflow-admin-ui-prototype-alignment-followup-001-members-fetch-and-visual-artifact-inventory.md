# workflow-admin-ui-prototype-alignment-followup-001-members-fetch-and-visual artifact inventory

## Canonical files

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/outputs/artifacts.json` |
| Phase 11 evidence inventory | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/outputs/phase-11/evidence-inventory.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |

## Registration

`admin-ui-prototype-alignment-followup-001-members-fetch-and-visual` is registered as `implemented_local_runtime_pending / implementation / VISUAL`.

The workflow scopes `/admin/members` list + drawer prototype alignment and `ADMIN_FETCH_404` root-cause repair. Local implementation and local gates are complete. Staging deploy, visual baseline PNG capture, commit, push, and PR are user-gated.

## Implemented targets

| Area | Files |
| --- | --- |
| 404 root-cause fix | `apps/web/src/lib/admin/safe-server-fetch.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/lib/env.ts`, conditionally `apps/api/wrangler.toml` |
| adapter | `apps/web/src/features/admin/adapters/members-view-model.ts`, `packages/shared/src/types/viewmodel/index.ts` |
| UI | `apps/web/src/features/admin/components/_members/{MembersTable,MembersFilters,MemberDrawer}.tsx`, admin page-head composition |
| primitives | `apps/web/src/components/ui/{Avatar,Chip,PillNav}.tsx` only if additive top-up is required |
| tests | focused member component specs, adapter spec, safe-server-fetch/route specs, `apps/web/playwright/tests/visual-staging/admin-members-*-aligned.spec.ts` |

## Evidence boundary

| Evidence | Status |
| --- | --- |
| Phase 1-5 specs | present |
| Phase 11 runtime screenshots | pending user-gated staging execution |
| Phase 11 `/admin/members` 200 trace | pending user-gated staging execution |
| Phase 12 strict 7 | present |
| root/output artifacts parity | present |
