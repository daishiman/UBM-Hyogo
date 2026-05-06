# Implementation Guide

## Part 1: Plain Explanation

Staging and production are separate environments. Staging is where we check that the smoke route works before touching production. Production is the real service, so it needs one extra safety switch: `x-smoke-production-confirm: YES`.

The route uses the same secret names in staging and production, but the values are different per Cloudflare environment. This keeps code simple while preventing staging secrets from being reused in production.

Logs must never contain actual DSN URLs, Slack webhook URLs, tokens, hashes, or numeric Sentry project ids. Evidence stores only safe facts such as short event ids, timestamps, and Slack permalinks.

## Part 2: Technical Guide

Code changes:

- `apps/api/src/routes/admin/smoke-observability.ts` now keeps Bearer authentication first.
- Production requests require `x-smoke-production-confirm: YES`.
- Slack text uses `[STAGING SMOKE]` or `[PRODUCTION SMOKE]` from the runtime environment.
- Sentry event payload uses `environment: staging` or `environment: production`.

Secret placement:

- `SMOKE_ADMIN_TOKEN`
- `SENTRY_DSN_API`
- `SLACK_WEBHOOK_INCIDENT`

These are Cloudflare Secrets. They are not declared as values in `wrangler.toml`; use `bash scripts/cf.sh secret list/put --env <env>`.

Runtime flow:

1. G1: confirm the production 1Password items and place production secrets.
2. G2: confirm staging smoke PASS.
3. G3: run production smoke with the confirmation header.
4. G4: confirm redaction grep and complete evidence.

Related specs: `../../phase-02.md`, `../../phase-05.md`, `../../phase-11.md`.
