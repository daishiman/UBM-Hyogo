---
classification: configuration
detected_at: 2026-05-15T06:54:00+09:00
d_prime_zero: pending_user_approval
cycle: 2
parent_summary_json: missing
---

# Recovery Root Cause Evidence

## Read-only GitHub Actions Check

Command:

```bash
gh run list --workflow=cf-audit-log-monitor.yml --limit 5 \
  --json databaseId,createdAt,conclusion,status,displayTitle,workflowName,url
gh run view 25887044451
```

Observed latest run:

| run id | created_at | conclusion | status | url |
| --- | --- | --- | --- | --- |
| 25887044451 | 2026-05-14T21:35:30Z | failure | completed | https://github.com/daishiman/UBM-Hyogo/actions/runs/25887044451 |

GitHub annotation:

| annotation | value |
| --- | --- |
| environment protection | Branch `dev` is not allowed to deploy to production due to environment protection rules |
| deployment result | The deployment was rejected or did not satisfy other protection rules |

## Classification

This is classified as `configuration`: the workflow YAML requests
`environment: production`, but the current scheduled branch is `dev` and the
GitHub production environment protection rule rejects that branch before the
job can collect hourly snapshots.

## Fix Boundary

The required fix is a user-gated GitHub environment / branch-policy decision:

- allow the scheduled `dev` branch to use the production environment for this
  read-only monitor, or
- move the scheduled production monitor to an allowed branch / environment
  topology, or
- provide a dedicated read-only environment whose protection rules allow the
  scheduler and whose secrets/variables are scoped to the monitor.

No GitHub environment mutation was executed in this cycle.
