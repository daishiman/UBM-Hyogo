# Manual Test Checklist

## Scope

NON_VISUAL runbook formalization only. No UI screenshot, production D1 apply, or Cloudflare write operation is executed in this task.

## Checks

- [x] Runbook structure evidence exists: `structure-verification.md`
- [x] Grep verification evidence exists: `grep-verification.md`
- [x] Staging dry-run is recorded as `OPERATOR_GATE_OPEN`: `staging-dry-run.md`
- [x] Redaction check evidence exists: `redaction-check.md`
- [x] Production apply execution is delegated to `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md`
