# OIDC Rollback Runbook

## Status

SPEC_CREATED / RUNTIME_PENDING

## Rule

Rollback is an emergency path only. It may reintroduce a long-lived Cloudflare deploy token for at most 24 hours after explicit user approval. It must not become the normal deployment path again.

## Steps

1. Stop the failing OIDC cutover workflow and preserve sanitized run URLs.
2. Obtain explicit user approval for emergency rollback.
3. Reintroduce the minimum-scope Cloudflare token as an environment-scoped GitHub secret only for the affected environment.
4. Run the affected workflow once and capture sanitized workflow URL / conclusion only.
5. Remove the temporary secret within 24 hours.
6. Record the incident and restore the OIDC path before the next normal deploy.

## Evidence Redaction

Do not record token values, token hashes, token IDs, OIDC JWTs, 1Password item names, or raw AWS temporary credentials.
