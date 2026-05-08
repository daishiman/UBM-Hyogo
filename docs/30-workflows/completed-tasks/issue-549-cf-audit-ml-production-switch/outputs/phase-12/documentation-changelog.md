# Documentation Changelog

## Entry Checklist

| check | result |
| --- | --- |
| `git status --porcelain apps/ packages/` | 0 件 |
| `git diff --name-only main...HEAD -- 'apps/**' 'packages/**'` | baseline diff は未取得。作業木上の apps/packages dirty diff は 0 件 |
| placeholder grep | 旧 placeholder token と production path 仮名が残っていないことを最終検証で確認 |

## Changed Files

| path | change-summary | wave |
| --- | --- | --- |
| `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` | Phase 1-13 contract / Phase 11-12 outputs | same-wave |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Issue #549 production switch contract | same-wave |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | ML_MODEL_PATH / fallback threshold boundary | same-wave |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback + 7 day observation runbook | same-wave |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | sync log | same-wave |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | skill feedback log | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md` | post-switch close-out task | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md` | model artifact rotation task | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` | alert channel extension task | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` | gate metadata task | same-wave |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` | evidence path schema task | same-wave |
