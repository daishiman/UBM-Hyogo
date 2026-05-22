# Documentation changelog

| Date | Type | Path | Change |
| --- | --- | --- | --- |
| 2026-05-16 | Added | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` | Formal workflow specification and Phase 12 outputs |
| 2026-05-16 | Changed | `.github/workflows/cf-audit-log-monitor.yml` | Removed read-only monitor job from `production` environment gate |
| 2026-05-16 | Changed | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Added monitoring-vs-deploy environment separation rule |
| 2026-05-16 | Changed | `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` | Marked source task as consumed by this implementation spec |
| 2026-05-16 | Added | `outputs/phase-11/inventory-before.md`, `workflow-dispatch-dryrun.md/json`, `runtime-evidence/hourly-runs.json`, `runtime-evidence/heartbeat-after.txt` | Added user-gated placeholder evidence files required by Phase 11 manifest |
| 2026-05-16 | Changed | `.claude/skills/task-specification-creator/` | Promoted Issue #720 environment separation and planned evidence completeness rules |
| 2026-05-16 | Changed | `.claude/skills/aiworkflow-requirements/` | Registered Issue #720 workflow and corrected Issue #655 completed path references |
| 2026-05-16 | Added | `outputs/phase-09/acceptance.md` | Split local acceptance from post-merge runtime acceptance |
| 2026-05-16 | Added | `outputs/artifacts.json` and `artifacts.json` | Added root/output artifact parity |
