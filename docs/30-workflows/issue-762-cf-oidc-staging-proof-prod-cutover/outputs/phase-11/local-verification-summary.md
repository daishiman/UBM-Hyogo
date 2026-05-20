# Local Verification Summary

Tracked Markdown summary for Phase 11 local evidence. Raw `.log` files in this directory are ignored by the repository-wide `*.log` rule, so this file is the canonical tracked evidence for the local command results.

## Commands

| Command | Result |
|---|---|
| `bash scripts/oidc/__tests__/verify-claim-pin.spec.sh` | PASS: 9 assertions passed |
| `bash scripts/__tests__/redaction-check.test.sh` | PASS: 15 assertions passed |
| `shellcheck scripts/oidc/verify-claim-pin.sh scripts/oidc/__tests__/verify-claim-pin.spec.sh scripts/redaction-check.sh scripts/__tests__/redaction-check.test.sh` | PASS: no output |
| downloaded `actionlint` via `rhysd/actionlint` installer, then ran `.github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml` | PASS: no output |
| `grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml` | PASS: `2` |
| `grep -n "id-token" .github/workflows/web-cd.yml .github/workflows/oidc-observation-window.yml` | PASS: no matches |
| `cmp -s docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/artifacts.json docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/artifacts.json` | PASS: exit 0 |
| `pnpm indexes:rebuild` | PASS: indexes regenerated |
| `pnpm observation:lint` | PASS: observation shell tests 13/13 and actionlint including `oidc-observation-window.yml` |

## User-Gated Remote Evidence

`oidc-observation-window` remote dispatch was not executed because commit / push / remote workflow execution are user-gated. The tracked local evidence confirms the workflow is manual-only, grants only `contents: read`, and contains no `id-token` permission.
