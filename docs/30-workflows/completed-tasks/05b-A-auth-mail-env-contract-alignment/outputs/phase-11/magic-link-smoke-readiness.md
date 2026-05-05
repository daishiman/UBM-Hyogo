# Magic Link Smoke Readiness

## Readiness criteria

| Criterion | Owner | Evidence |
| --- | --- | --- |
| `MAIL_PROVIDER_KEY` exists in staging Cloudflare Secrets | 09a execution | name-only secret list |
| `MAIL_FROM_ADDRESS` exists for staging | 09a execution | variable name/value location, no secret value |
| `AUTH_URL` points to staging callback base | 09a execution | variable name/value location |
| Old names are absent from staging | 09a execution | name-only negative check |

## Not executed in this workflow

- No staging or production `POST /auth/magic-link` request was sent.
- No inbox, provider dashboard, token URL, or email body was captured.
- No production fail-closed test was executed.

## Delegation

Real send smoke belongs to `09a-A-staging-deploy-smoke-execution`. Production readiness belongs to `09c-A-production-deploy-execution`.
