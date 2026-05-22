# workflow_dispatch dry_run evidence

Status: `PENDING_USER_GATE`

This evidence cannot be truthfully completed before repository-level secret and
variable mirroring, push, PR, and merge are approved. The runtime command is reserved
for the user-gated execution wave.

Canonical command after approval:

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
```

PASS requires a real GitHub Actions run URL under
`https://github.com/daishiman/UBM-Hyogo/actions/runs/`, `conclusion == "success"`,
and successful completion of the fetch, analyze dry-run, hourly snapshot, leakage
grep, fallback-rate dry-run, artifact upload, and heartbeat update steps.
