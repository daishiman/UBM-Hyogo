# Manual Smoke Log

Status: `PASS_WITH_RUNTIME_BLOCKERS`

## Commands Executed On 2026-05-08

```bash
gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id,status,conclusion,createdAt:.created_at,updatedAt:.updated_at,headSha:.head_sha,event,url:.html_url}' \
  | jq -s '.' \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json

gh run list --workflow=cf-audit-log-monitor-watchdog.yml --limit 200 \
  --json databaseId,status,conclusion,createdAt,updatedAt,event,url \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-watchdog.json

gh issue list --state all --label cf-audit --limit 200 \
  --json number,title,state,labels,createdAt,closedAt,url \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-issues-cf-audit.json
```

## Result

| Command | Result | Evidence |
| --- | --- | --- |
| `gh api --paginate ... cf-audit-log-monitor.yml/runs` | PASS | 32 monitor runs saved to `gh-run-list-cf-audit-log-monitor.json` |
| `gh run list --workflow=cf-audit-log-monitor-watchdog.yml --limit 200` | PASS | 32 watchdog runs saved to `gh-run-list-watchdog.json` |
| `gh issue list --state all --label cf-audit --limit 200` | PASS | 0 issues saved to `gh-issues-cf-audit.json` |
| `gh issue list --state all --search "cf-audit tuning OR cf audit baseline"` | PASS | 3 related issues saved to `tuning-cost-issues.json` |
| `bash scripts/cf.sh audit-log baseline --days 90` | FAIL | local esbuild host/binary version mismatch: host 0.27.3 vs binary 0.21.5 |
| `bash scripts/cf.sh d1 execute ... SELECT COUNT(*)` | FAIL | redacted Cloudflare D1 error saved to `d1-cf-audit-90day-summary.json`: `no such table: cf_audit_log` |

No mutation command was executed.
