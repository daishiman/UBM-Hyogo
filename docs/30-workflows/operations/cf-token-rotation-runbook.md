# Cloudflare API Token 90 Day Rotation Runbook

## 1. Overview

This runbook is the operating procedure for rotating the long-lived Cloudflare API token used by GitHub Actions deployment and Cloudflare operations.

### 1.1 Why 90 days

Ninety days keeps the exposure window short while leaving enough time for staging-first verification and production approval. The value is an operating policy, not a Cloudflare limitation. Review it after each completed rotation.

### 1.2 Why 24 hour parallel operation

The old token remains available for one day after the new token is installed. This gives scheduled workflows, deployment jobs, and manual checks time to expose failures before rollback becomes impossible.

## 2. Terms And Preconditions

- Use separate staging and production GitHub environment secrets.
- Keep the secret value only in 1Password and GitHub Secrets.
- Use `bash scripts/cf.sh` for Cloudflare CLI operations.
- Do not record token values, token identifiers, or detailed scope values in this file, logs, issues, commits, or pull request text.
- OIDC migration work is outside this runbook. After U-FIX-CF-ACCT-01-DERIV-01, revise this procedure.

## 3. Preflight Checklist

- Confirm the active branch and pending diff are understood.
- Confirm `bash scripts/cf.sh whoami` succeeds with the current environment.
- Confirm the 1Password item has a 90 day expiry reminder.
- Confirm `CF_TOKEN_ISSUED_AT` is set as an ISO 8601 GitHub variable.
- Confirm the labels exist: `gh label create ops --color BFD4F2 --force`, `gh label create cloudflare --color 1D76DB --force`, `gh label create token-rotation --color D93F0B --force`.
- Confirm the latest staging deployment smoke passed before touching production.

## 4. Staging Rotation

1. Keep the old staging token enabled.
2. Create the new staging token in Cloudflare Dashboard using the approved minimum-permission policy from U-FIX-CF-ACCT-01.
3. Update the 1Password item with the new value.
4. Inject the derived copy into GitHub: `gh secret set CLOUDFLARE_API_TOKEN --env staging`.
5. Run staging smoke checks through `bash scripts/cf.sh`.
6. Observe staging for 24 hours.
7. Disable the old staging token.
8. After another 24 hours without rollback, delete the old staging token.

## 5. Production Rotation

Proceed only after staging rotation and smoke checks are complete and the user approves the production gate.

1. Keep the old production token enabled.
2. Create the new production token in Cloudflare Dashboard using the approved minimum-permission policy from U-FIX-CF-ACCT-01.
3. Update the 1Password item with the new value.
4. Inject the derived copy into GitHub: `gh secret set CLOUDFLARE_API_TOKEN --env production`.
5. Run production smoke checks through `bash scripts/cf.sh`.
6. Observe production for 24 hours.
7. Disable the old production token.
8. After another 24 hours without rollback, delete the old production token.
9. Update `CF_TOKEN_ISSUED_AT` to the new issue date in ISO 8601 format.

## 6. Rollback

1. Re-enable the old token in Cloudflare Dashboard if it is only disabled.
2. Re-inject the old value with `gh secret set CLOUDFLARE_API_TOKEN --env <environment>`.
3. Re-run smoke checks through `bash scripts/cf.sh`.
4. Disable the new token.
5. Add a rollback note to `docs/30-workflows/operations/cf-token-rotation-log.md`.

If the old token has already been deleted, create a replacement token using the approved policy, update 1Password, inject the new GitHub secret, and restart from staging.

## 7. 1Password Reminder

Set the 1Password item expiry reminder to 90 days from the production issue date. Record only the issue date and reminder date in the rotation log. Do not record the secret value.

## 8. Rotation Log

Append every execution to `docs/30-workflows/operations/cf-token-rotation-log.md`. Keep the log append-only. If a correction is needed, add a new correction row instead of editing prior history.

## 9. Known Pitfalls

- Do not skip staging.
- Do not delete the old token during the first 24 hour observation window.
- Do not use direct `wrangler` commands when `scripts/cf.sh` covers the operation.
- Do not treat the reminder workflow as rotation automation. It only opens an issue.
- After OIDC migration, this long-lived token runbook must be revised or retired.
