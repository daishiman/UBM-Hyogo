# Phase 11 Link Checklist

判定: IMPLEMENTED_LOCAL_RUNTIME_PENDING

| 参照 | path | 状態 |
| --- | --- | --- |
| target workflow | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/index.md` | OK |
| artifacts | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/artifacts.json` | OK |
| parent unassigned | `docs/30-workflows/completed-tasks/issue-515-production-ml-switch.md` | OK |
| parent workflow | `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md` | OK |
| monitor workflow | `.github/workflows/cf-audit-log-monitor.yml` | OK |
| watchdog workflow | `.github/workflows/cf-audit-log-monitor-watchdog.yml` | intentionally absent after Issue #518 HOLD; do not recreate |
| ML classifier | `scripts/cf-audit-log/classifier/ml.ts` | OK |
| leakage grep | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | OK |
| D1 forward-safe migration | `apps/api/migrations/0016_cf_audit_log_classification.sql` | OK |
| runbook SSOT | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | OK |
| observability SSOT | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | OK |
| secret SSOT | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | OK |
