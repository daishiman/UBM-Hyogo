# Hourly 6 consecutive success evidence

Status: `PENDING_USER_GATE`

This evidence cannot be truthfully completed in this local cycle because it requires:

1. Repository-level secrets and variables to be mirrored by the user.
2. The workflow YAML change to be pushed and merged.
3. At least six wall-clock hours of scheduled GitHub Actions runs.

The canonical collection command after approval is:

```bash
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event
```

PASS requires the latest six scheduled runs to have `conclusion == "success"` and real run URLs.
