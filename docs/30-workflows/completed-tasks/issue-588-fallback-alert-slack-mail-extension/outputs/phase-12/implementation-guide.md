# Implementation Guide

## Summary

Issue #588 extends the Cloudflare audit-log fallback-rate alert from GitHub Issue-only reporting to GitHub Issue + Slack + mail HTTP webhook notification.

## Part 1: Concept

When the Cloudflare audit-log classifier falls back too often for three hours in a row, the system should not rely on only a GitHub Issue. This change keeps the GitHub Issue as the required audit trail and also sends best-effort Slack and mail notifications so operators notice the incident sooner.

The notification text is cleaned before it is sent. User IDs, tenant IDs, long hashes, bearer tokens, and Slack webhook URLs are replaced with redacted markers. Slack and mail failures are recorded but do not stop the GitHub Issue from being created.

## Implementation Surface

| Path | Change |
| --- | --- |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | Redaction, notification payload, Slack dispatcher, mail dispatcher, dry-run payload output, parallel best-effort notification isolation |
| `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` | Focused tests covering legacy behavior and notification extension |
| `.github/workflows/cf-audit-log-monitor.yml` | Guarded fallback notification step after `analyze.ts` |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Runtime and secret boundary |

## Commands

```bash
pnpm exec vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts
pnpm typecheck
pnpm lint
```

## Runtime Contract

`SLACK_WEBHOOK_INCIDENT` is the canonical GitHub Actions secret for Slack delivery. The CLI also accepts legacy `SLACK_WEBHOOK_URL` as a local fallback only. `EMAIL_WEBHOOK_URL`, `EMAIL_FROM`, and `EMAIL_TO` enable mail delivery. Missing Slack or mail settings skip only that destination; GitHub Issue creation still runs when the alert is triggered and not in dry-run mode.

## PR Boundary

Use `Refs #588`, not `Closes #588`, because the source GitHub Issue is already closed. Commit, push, PR, secret mutation, and production verification remain user-gated.
