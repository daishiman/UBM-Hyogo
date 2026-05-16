# staging-runtime-smoke Secret Finalization Runbook

## Boundary

This runbook is for the user only. AI must not run `op read`, `gh secret set`,
or `gh workflow run` for this task. Persist only secret names, counts, and run
URLs; never persist values, hashes, suffixes, token lengths, bearer fragments,
member IDs, cookies, or webhook URLs.

## Required Names

| Name | Scope | Purpose |
| --- | --- | --- |
| `STAGING_API_BASE` | `staging-runtime-smoke` environment | staging API endpoint for smoke |
| `STAGING_ADMIN_BEARER` | `staging-runtime-smoke` environment | admin smoke authorization |
| `STAGING_MEMBER_ID` | `staging-runtime-smoke` environment | member smoke target |
| `STAGING_ME_BEARER` | `staging-runtime-smoke` environment | `/me` smoke authorization |
| `SLACK_WEBHOOK_INCIDENT` | `staging-runtime-smoke` environment | failure notification |

## Before

```bash
gh auth status
op whoami
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
```

Expected before the user operation in this cycle: the five names above are not
all present.

## Provision

Use the canonical operator script where possible:

```bash
bash scripts/smoke/provision-staging-secrets.sh
```

If manual entry is needed, use this pattern and substitute the user's local
1Password item paths. The placeholder paths below are examples, not canonical
vault names:

```bash
op read 'op://<Vault>/<Item>/STAGING_API_BASE' \
  | gh secret set STAGING_API_BASE --env staging-runtime-smoke

op read 'op://<Vault>/<Item>/STAGING_ADMIN_BEARER' \
  | gh secret set STAGING_ADMIN_BEARER --env staging-runtime-smoke

op read 'op://<Vault>/<Item>/STAGING_MEMBER_ID' \
  | gh secret set STAGING_MEMBER_ID --env staging-runtime-smoke

op read 'op://<Vault>/<Item>/STAGING_ME_BEARER' \
  | gh secret set STAGING_ME_BEARER --env staging-runtime-smoke

op read 'op://<Vault>/<Item>/SLACK_WEBHOOK_INCIDENT' \
  | gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke
```

## After

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
```

Expected name-only output:

```text
SLACK_WEBHOOK_INCIDENT
STAGING_ADMIN_BEARER
STAGING_API_BASE
STAGING_ME_BEARER
STAGING_MEMBER_ID
```

## Runtime Smoke

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
gh run list --workflow=runtime-smoke-staging.yml --branch dev --limit 1
gh run view <RUN_ID> --log
```

Success criteria:

- `verify required staging secrets` passes.
- `run runtime smoke` is reached.
- The run conclusion is `success`.
- Captured evidence contains run id, URL, step names, and conclusions only.
