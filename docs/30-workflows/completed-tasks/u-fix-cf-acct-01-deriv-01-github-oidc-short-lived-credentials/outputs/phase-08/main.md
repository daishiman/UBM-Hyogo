# Phase 8 Output: DRY 化

## Status

SPEC_CREATED

## DRY Contract

OIDC auth should be centralized in one reusable surface rather than duplicated across `web-cd.yml`, `backend-ci.yml`, and future deploy workflows.

| Surface | Contract |
| --- | --- |
| workflow auth | reserved composite action `.github/actions/cf-oidc-auth/action.yml` |
| shell auth | `scripts/cf.sh` reads `CF_AUTH_MODE=oidc-short-lived` in CI and skips local `op run` |
| docs SSOT | aiworkflow `deployment-gha.md` and `deployment-secrets-management.md` |

