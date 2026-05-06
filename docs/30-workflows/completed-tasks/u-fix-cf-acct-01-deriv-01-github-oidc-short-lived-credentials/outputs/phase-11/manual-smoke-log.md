# Phase 11 Manual Smoke Log

## Status

RUNTIME_PENDING

No GitHub Actions deploy, Cloudflare token issuance, Cloudflare token revoke, workflow edit, commit, push, or PR operation was executed in this spec-created cycle.

## Operator Log Template

| Gate | Runtime Operation | Required Evidence | Current Status |
| --- | --- | --- | --- |
| G1 | AWS STS trust policy / broker configuration | sanitized trust policy summary, allowed `sub` / `aud` matrix | PENDING_USER_APPROVAL |
| G2 | staging cutover for `web-cd.yml`, `backend-ci.yml`, `d1-migration-verify.yml` impact check | staging workflow run URLs, legacy token grep zero match | PENDING_USER_APPROVAL |
| G3 | production cutover after 7-day staging green | production workflow run URLs, 24h parallel run ledger | PENDING_USER_APPROVAL |
| G4 | old token revoke | old-token `last_used_on` unchanged, revoke confirmation without token value/hash | PENDING_USER_APPROVAL |

## Current Boundary

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_API_TOKEN_STAGING` remain current GitHub secret facts.
- Runtime evidence will replace this template only after explicit user approval for the relevant gate.
- Secret values, hashes, token IDs, OIDC JWTs, and 1Password item details must not be written to this file.
