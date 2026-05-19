# System Spec Update Summary

## Step 1-A: Canonical Implementation Set

Current canonical set:
- `apps/api/migrations/0018_add_audit_log_export_manifest.sql`
- `apps/api/src/lib/audit/redact.ts`
- `apps/api/src/repository/auditLog.ts`
- `apps/api/src/routes/admin/audit.ts`
- `apps/api/src/env.ts`
- `scripts/audit-log/export-to-r2.ts`
- `.github/workflows/audit-log-cold-storage.yml`
- `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`

## Step 1-B: aiworkflow Requirements Sync

State vocabulary:
`implemented_local_evidence_captured / implementation_complete_pending_pr / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.

Updated same-wave references:
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260518-issue315-audit-log-application-cold-storage.md`

Validation:
- `pnpm run indexes:rebuild` executed after the resource-map update. `keywords.json` regenerated with no tracked diff.

## Step 1-C: Runtime Boundary

Production D1 migration apply, R2 bucket Object Lock creation, deploy, and first production workflow observation are gated by explicit user approval. The workflow and CLI now contain an executable non-dry-run path; no commit, push, PR, D1 apply, R2 bucket creation, deploy, or live R2 PUT was performed in this review cycle.

## Step 2: Stale Contract Withdrawal

The previous external SIEM direction is intentionally not carried forward as an open task. R2 + Object Lock is the selected minimal solution for the current solo-dev/free-operation constraint.
