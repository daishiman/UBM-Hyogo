# task-02 Implementation Guide

Local implementation:

- Add `scripts/smoke/provision-staging-secrets.sh`.
- Guard `.github/workflows/runtime-smoke-staging.yml` Slack posting with `hashFiles('ci-evidence/summary.json')`.

User-gated runtime operation:

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke
bash scripts/smoke/provision-staging-secrets.sh
```

The script prints secret names only.
