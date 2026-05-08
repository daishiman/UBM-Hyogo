# Slack Incidents Channel Provisioning Runbook

## Scope

This runbook provisions `#ubm-hyogo-incidents`, stores the incoming webhook in 1Password, places `SLACK_WEBHOOK_INCIDENT` into Cloudflare staging / production and GitHub Actions, then verifies staging and production smoke delivery. It never records a webhook URL value, token, workspace fragment, or value hash.

## Gates

| Gate | Operation | Evidence |
| --- | --- | --- |
| G1 | Create or reuse `#ubm-hyogo-incidents` and create or reuse its incoming webhook | `outputs/phase-11/channel-provisioning-log.md` |
| G2 | Store the webhook in 1Password and put the staging Cloudflare secret | `outputs/phase-11/channel-provisioning-log.md` |
| G3 | Confirm staging smoke, then put the production Cloudflare secret | `outputs/phase-11/webhook-smoke-log.md` |
| G4 | Confirm production smoke and redaction grep PASS | `outputs/phase-11/webhook-smoke-log.md` |

Each gate requires separate user approval. A single approval must not cover multiple gates.

## Steps

1. In Slack, create or reuse private channel `#ubm-hyogo-incidents`.
2. Create or reuse an incoming webhook for that channel.
3. Store the webhook URL in 1Password item `SLACK_WEBHOOK_INCIDENT`, field `url`.
4. Record only `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` style references in docs and examples.
5. Put staging secret with stdin:

```bash
op read "op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING" \
  | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT \
      --config apps/api/wrangler.toml \
      --env staging
```

6. Verify staging with name-only output:

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  | grep SLACK_WEBHOOK_INCIDENT
```

7. After staging smoke PASS, put and verify production with the same commands and `--env production`.
8. If CI smoke needs the secret, set it through stdin:

```bash
op read "op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION" \
  | gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo
```

9. Run the redaction gate before saving evidence and before PR creation:

```bash
bash scripts/redaction-grep.sh .
```

## Evidence Rules

- Store Slack channel name, short channel ID prefix, timestamps, status codes, and smoke prefixes only.
- Do not store full permalinks if they include workspace-specific fragments.
- Do not paste `op read` output into terminal logs, docs, issue comments, PR bodies, or evidence files.

## Rotation

If a webhook URL or fragment is exposed:

1. Disable the Slack webhook immediately.
2. Create a replacement webhook for `#ubm-hyogo-incidents`.
3. Update 1Password.
4. Re-run Cloudflare staging / production secret put.
5. Re-run GitHub secret set if used.
6. Run `bash scripts/redaction-grep.sh .` and keep only the 0-hit summary.
