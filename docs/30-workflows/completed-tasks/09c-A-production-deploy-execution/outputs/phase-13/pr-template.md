# PR Template: 09c-A-production-deploy-execution

判定行: `PENDING_USER_APPROVAL`

## Summary

- Formalizes the 09c-A production deploy execution workflow.
- Keeps runtime production mutation pending until explicit approval.
- Uses `Refs #353`; do not use `Closes #353` in this spec-created PR.

## Scope

- Workflow root: `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/`
- Classification: `spec_created / implementation / VISUAL_ON_EXECUTION`
- Runtime state: `PENDING_RUNTIME_EVIDENCE`

## Canonical Commands

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml
```

## Phase 11 Evidence Boundary

Phase 11 placeholder files are present to reserve evidence paths. They are not runtime PASS evidence. Production screenshots and metrics screenshots are captured only during the approved execution operation.

## Tests

- Pending: documentation/index verification commands.
- Not run here: production D1 migration, production deploy, release tag push, production smoke, 24h verification.

## Follow-Up

- Approved production execution operation writes real evidence into `outputs/phase-11/`.
- Runtime close-out wave updates workflow state after execution.
