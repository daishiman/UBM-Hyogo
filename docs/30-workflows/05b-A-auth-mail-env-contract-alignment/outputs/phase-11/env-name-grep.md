# Env Name Grep Evidence

## Purpose

Confirm that canonical Auth + Magic Link env names are documented and that stale names are treated only as historical migration terms inside this workflow.

## Canonical names

- `MAIL_PROVIDER_KEY`
- `MAIL_FROM_ADDRESS`
- `AUTH_URL`

## Historical stale names

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SITE_URL`

These stale names must not be added to runtime implementation or provisioning runbooks as active names. They may appear in this workflow only when explaining the withdrawal mapping.

## Command template

```bash
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|\bSITE_URL\b' \
  docs/00-getting-started-manual/specs/10-notification-auth.md \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

Expected active-spec result after this alignment: no active current contract file uses the stale names for Magic Link mail provisioning. Workflow-local migration notes, lessons, and artifact inventories are historical records and are intentionally outside this grep target.

## Boundary

This file is name-only evidence. It must not include secret values, token fragments, hashes, provider response bodies, or `op read` output.
