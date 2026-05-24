# Workflow artifact inventory: issue-836 schema alias recompute trigger

## Metadata

| Item | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/` |
| status | `spec_created / implementation / VISUAL / Phase 12 strict 7 present / runtime_pending` |
| issue | `#836` CLOSED; PR wording uses `Refs #836` only |
| source | `docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` consumed via canonical workflow |
| parent | `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` |

## Workflow Files

| Classification | Path | Status |
| --- | --- | --- |
| root index | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/index.md` | present |
| root artifact ledger | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/artifacts.json` | present |
| output artifact mirror | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/artifacts.json` | present |
| phases | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/phase-01.md` .. `phase-13.md` | present |
| Phase 02 design | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md` | present |
| Phase 11 placeholders | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/phase-11/{migration-apply,recompute-runtime,visual-baseline}.md` | pending |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | present |
| Phase 13 summary | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/outputs/phase-13/pr-summary.md` | present |

## Planned Implementation Targets

| Layer | Path |
| --- | --- |
| D1 migration | `apps/api/migrations/0020_schema_alias_recompute_jobs.sql` |
| API workflow | `apps/api/src/workflows/schemaAliasRecompute.ts` |
| job repository | `apps/api/src/repository/schemaAliasRecomputeJobs.ts` |
| API route | `apps/api/src/routes/admin/schema.ts` |
| web helper | `apps/web/src/lib/admin/api.ts` |
| UI | `apps/web/src/components/admin/SchemaDiffPanel.tsx` |
| specs | `docs/00-getting-started-manual/specs/{01-api-schema.md,11-admin-management.md}` |

## Boundary

Local code implementation, staging / production D1 migration apply, visual baseline capture, commit, push, and PR are user-gated. This inventory records spec readiness and same-wave system-spec synchronization only.
