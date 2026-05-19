# PR Body Draft

## Summary

- Implements Issue #762 pre-support Cloudflare OIDC hardening without changing the live `web-cd.yml` deploy credential path.
- Adds subject claim dry-run verification, OIDC-shaped redaction checks, a manual observation gate placeholder, requirements sync, and current-baseline comments.
- Keeps real OIDC cutover, staging proof, production cutover, and legacy token physical revocation blocked until official Cloudflare support is confirmed.

## Test plan

- `bash scripts/oidc/__tests__/verify-claim-pin.spec.sh`
- `bash scripts/__tests__/redaction-check.test.sh`
- `grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml`
- `grep -n "id-token" .github/workflows/web-cd.yml .github/workflows/oidc-observation-window.yml`
- `pnpm indexes:rebuild`

## Not included

- `git push` / PR creation without user approval.
- Cloudflare, GitHub Secret, or 1Password mutation.
- Runtime OIDC deploy or real token exchange.
