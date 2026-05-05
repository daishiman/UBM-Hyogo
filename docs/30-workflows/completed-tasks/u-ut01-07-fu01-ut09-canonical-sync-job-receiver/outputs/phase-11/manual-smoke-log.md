# Manual Smoke Log

Status: completed.

| Check | Command | Expected |
| --- | --- | --- |
| UT-09 receiver path exists | `test -f docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | exit 0 |
| Parent Phase 2 files exist | `ls docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/*.md` | 4 canonical files present |
| Physical `sync_log` table is not introduced | `rg -n "CREATE TABLE\\s+sync_log\\b|RENAME TO\\s+sync_log\\b|DROP TABLE\\s+sync_job_logs\\b" apps/api/migrations apps/api/src packages/shared 2>/dev/null` | 0 implementation violations |
| Canonical names are searchable | `rg -n "sync_job_logs\\b|sync_locks\\b" docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` | at least one hit per name |

Runtime code execution is outside this workflow and remains delegated to UT-09 implementation work.

## Execution Result

| Check | Result | Note |
| --- | --- | --- |
| UT-09 receiver path exists | PASS | `test -f .../UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` returned exit 0 |
| Parent Phase 2 files exist | PASS | 4 canonical files found under `completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/` |
| Physical `sync_log` table is not introduced | PASS | implementation-scoped grep returned no hits |
| Canonical names are searchable | PASS | `sync_job_logs` / `sync_locks` are present in this workflow and now linked from the receiver note |
