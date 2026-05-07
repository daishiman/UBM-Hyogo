# Phase 11 Main

## Status

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

Local script/API contracts are implemented and documented, but the staging 10-trial runtime execution remains user-gated. This is not a runtime PASS.

## Evidence Files

| File | Status |
| --- | --- |
| `runtime-trial-log.md` | Boundary evidence and live command contract recorded. |
| `manual-smoke-log.md` | Local dry-run smoke commands recorded. |
| `link-checklist.md` | Required artifact links checked. |
| Parent `extended-fixture-50k-evidence.md` | Placeholder created; live JSON evidence pending user approval. |

## Runtime Command

```bash
export ADMIN_API_BASE_URL="https://<staging-api-host>"
export ADMIN_SESSION_JWT="<admin-session-jwt>"
bash scripts/schema-alias-backfill/run-stress-trial.sh \
  --trials 10 \
  --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 \
  --timeout-seconds 1800 \
  --api-base-url "$ADMIN_API_BASE_URL" \
  --evidence-out /tmp/evidence-50k.json
```

Production execution remains banned by script guards and the API route.
