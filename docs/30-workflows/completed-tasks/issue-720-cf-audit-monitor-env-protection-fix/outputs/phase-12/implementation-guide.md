# Implementation guide

## Local change

Remove only this line from `.github/workflows/cf-audit-log-monitor.yml`:

```yaml
environment: production
```

No other workflow field is changed.

## User-gated operations

The following operations are not executed by Codex without explicit user approval:

- `gh secret set` for the five monitor secrets.
- `gh variable set` for the nine monitor variables.
- `git push`.
- `gh pr create` / merge.
- `gh workflow run`.
- Production environment secret cleanup.

## 1Password / gh command examples

Use stdin or command substitution from `op read`; never paste secret values into
docs, shell history, or evidence files.

```bash
gh secret set CF_AUDIT_D1_TOKEN_PROD \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read op://Employee/ubm-hyogo-env/CF_AUDIT_D1_TOKEN_PROD)"

gh secret set CF_AUDIT_TOKEN_PROD \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read op://Employee/ubm-hyogo-env/CF_AUDIT_TOKEN_PROD)"

gh variable set CF_AUDIT_CLASSIFIER \
  --repo daishiman/UBM-Hyogo \
  --body "ml"
```

Mirror only read-only monitor tokens and notification webhooks. Mutation-capable
deploy credentials remain environment-scoped.

## Execution order

1. Mirror repository secrets and variables from approved 1Password / production environment sources.
2. Confirm secret and variable names exist using name-only `gh secret list` and `gh variable list`.
3. Push the one-line workflow diff and open a PR to `dev`.
4. Merge only after review/CI approval.
5. After merge, run `workflow_dispatch` with `dry_run=true`.
6. Observe six consecutive scheduled successes.
7. Declare D'+0 from the first successful hourly run after the root-cause fix merge, following the runbook definition.
8. Only after stable runtime evidence, decide whether to clean up production-environment monitor secrets in a separate user-gated follow-up.

## Rollback

If the monitor fails due to missing credentials, add the missing repository-level name and rerun. If a security boundary issue appears, remove repository-level monitor secrets and restore `environment: production` in a rollback PR.
