# Workflow Artifact Inventory: admin-attendance-analytics-redesign

## Metadata

| Key | Value |
| --- | --- |
| workflow | `admin-attendance-analytics-redesign` |
| state | `implemented_local_runtime_pending / implementation / VISUAL / staging_visual_pending` |
| created | 2026-05-26 |
| current ref | `7f651a083` |
| root | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` |

## Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| workflow index | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/artifacts.json` | present |
| phase specs | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/phase-1.md` through `phase-13.md` | present |
| phase appendices | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/phase-2-appendix.md`, `phase-12-appendix.md` | present |
| shared context | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/_shared-context.md` | present |
| Phase 11 local evidence | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-11/runtime-evidence.md` | present |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-12/` | present |
| automation-30 evidence | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-12/automation-30-evidence.md` | present |
| API implementation | `apps/api/src/routes/admin/dashboard.ts`, `apps/api/src/repository/attendance-analytics.ts`, `apps/api/src/lib/{csv-export,parse-attendance-filter}.ts` | present |
| Web implementation | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`, `apps/web/src/features/admin/attendance/**`, `apps/web/src/lib/admin/fetch-attendance.ts` | present |
| Shared schema | `packages/shared/src/zod/admin-attendance.ts`, `packages/shared/src/zod/index.ts` | present |
| Canonical API spec | `docs/00-getting-started-manual/specs/01-api-schema.md`, `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | present |

## Boundary

This inventory records the local redesign implementation. Existing UT-02A attendance dashboard analytics is historical baseline. Staging deploy, staging 404 RCA, Playwright visual baseline, browser screenshots, CSV runtime download verification, commit, push, and PR remain user-gated.
