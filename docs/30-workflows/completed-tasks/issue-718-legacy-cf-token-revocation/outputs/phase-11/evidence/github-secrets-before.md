# GitHub Secrets Before

## Status

`template_completed_user_permission_pending`

## Allowed Read-Only Commands

```bash
gh secret list --env staging
gh secret list --env production
gh secret list
```

## Evidence Rules

Store secret names only. Do not store values, prefixes, suffixes, hashes, account IDs, or vault references containing secret material.

