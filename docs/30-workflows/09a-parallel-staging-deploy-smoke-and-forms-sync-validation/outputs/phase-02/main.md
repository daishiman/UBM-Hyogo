# Phase 2 Output: Design Summary

## Design Decision

Use a single staging gate with four lanes:

1. Deployment readiness: GitHub Actions, Cloudflare Pages/Workers, D1 staging binding, and secret presence.
2. Sync readiness: `POST /admin/sync/schema`, `POST /admin/sync/responses`, and `sync_jobs` audit.
3. UI smoke: public, member, auth, and admin routes on staging.
4. Guardrails: authorization denial, no direct D1 import from web, no admin body edit form, and free-tier checks.

## Evidence Boundary

Real staging evidence belongs in Phase 11. Placeholder files, skipped Playwright specs, and runbook-only statements must stay `NOT_EXECUTED` or `BLOCKED`.

## Outputs

- [staging-deploy-flow.md](staging-deploy-flow.md)
