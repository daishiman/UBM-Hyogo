# UT-07B Schema Alias Hardening Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| task_id | UT-07B-schema-alias-hardening-001 |
| workflow root | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` |
| status | implemented-local / Phase 1-12 completed / Phase 13 pending_user_approval |
| parent | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/` |
| issue | #293 CLOSED / PR text must use `Refs #293` |

## Workflow Artifacts

| Area | Paths |
| --- | --- |
| root docs | `index.md`, `phase-01.md` ... `phase-13.md`, `artifacts.json` |
| outputs ledger | `outputs/artifacts.json` |
| Phase 12 evidence | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| Phase 11 evidence | `outputs/phase-11/main.md`, `manual-evidence.md`, `link-checklist.md` |

## Implementation Artifacts

| Type | Paths |
| --- | --- |
| migration | `apps/api/migrations/0008_schema_alias_hardening.sql` |
| repository | `apps/api/src/repository/schemaAliases.ts`, `apps/api/src/repository/schemaDiffQueue.ts`, `apps/api/src/repository/schemaQuestions.ts` |
| workflow | `apps/api/src/workflows/schemaAliasAssign.ts` |
| route | `apps/api/src/routes/admin/schema.ts`, `apps/api/src/routes/admin/_shared.ts` |
| tests | `apps/api/src/routes/admin/schema.test.ts`, `apps/api/src/workflows/schemaAliasAssign.test.ts`, `apps/api/src/repository/__tests__/_setup.ts` |

## Evidence Summary

| Evidence | Status |
| --- | --- |
| route/workflow/repository local tests | PASS |
| API typecheck | PASS |
| NON_VISUAL screenshot | N/A |
| staging 10,000-row Workers/D1 measurement | staging-deferred |

## Follow-up Disposition

| Item | Disposition |
| --- | --- |
| queue/cron split | current workflow root is `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`; execute only if Phase 11 staging evidence proves repeated exhaustion. Historical stub: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md` |
| admin UI retry label | implemented-local as current workflow `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/`; source unassigned instruction remains historical trace at `docs/30-workflows/unassigned-task/task-ut-07b-fu-02-admin-schema-alias-retry-label.md`; UI surface changed in FU-02 only, while UT-07B hardening API/D1 contract remains unchanged. Web client predicate `isSchemaAliasRetryableContinuation` in `apps/web/src/lib/admin/api.ts` narrows on 5-point match (`status=202` ∧ `backfill.status='exhausted'` ∧ `retryable=true` ∧ `code='backfill_cpu_budget_exhausted'` ∧ `mode='apply'`); other shapes fall back to generic success/validation/conflict path. Lessons: `references/lessons-learned-ut07b-fu-02-admin-schema-alias-retry-label-2026-05.md` (L-UT07B-FU02-001..004) |
| production migration apply | current discoverable runbook stub is `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md`; actual apply execution formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` and remains approval-gated |
| production migration verification | runbook formalized as `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`; FU-04 current root is `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/` and is reclassified as already-applied verification + duplicate apply prohibition. Runtime read-only verification remains user-gated; duplicate apply is forbidden |
