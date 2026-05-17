# 2026-05-16 issue-720 cf-audit monitor environment protection fix

Issue #720 を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。
`.github/workflows/cf-audit-log-monitor.yml` の read-only / notification-only monitor job から
`environment: production` を削除し、GitHub production deployment environment の branch policy による
`dev` scheduled run block を local code diff で解消した。

同一 wave で `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に monitor vs deploy
environment separation を追記し、source unassigned task を
`consumed_via_issue_720_followup_spec` に同期した。repo-level secret / variable mirroring、push、PR、
workflow_dispatch dry run、six scheduled successes、D'+0 declaration、production environment monitor secret
cleanup は user-gated。

正本同期:

- `indexes/resource-map.md`
- `indexes/quick-reference.md`
- `references/task-workflow-active.md`
- `references/observability-monitoring.md`
- `references/workflow-issue-720-cf-audit-monitor-env-protection-fix-artifact-inventory.md`
- `SKILL-changelog.md`
- `LOGS/_legacy.md`
