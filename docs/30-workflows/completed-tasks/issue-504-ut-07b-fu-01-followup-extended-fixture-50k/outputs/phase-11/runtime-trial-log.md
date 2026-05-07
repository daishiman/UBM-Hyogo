# Runtime Trial Log

## Status

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

The live staging stress trial was not executed in this cycle because it requires explicit user approval, staging admin authentication, and Cloudflare runtime access. The runnable driver now exists at `scripts/schema-alias-backfill/run-stress-trial.sh`.

## Dry-Run Evidence Contract

```bash
bash scripts/schema-alias-backfill/run-stress-trial.sh \
  --trials 10 \
  --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 \
  --timeout-seconds 1800 \
  --evidence-out /tmp/evidence-50k.json \
  --dry-run
```

Expected: JSON skeleton with `runtime.environment=staging`, thresholds `retry_count<=3`, `dlq_count=0`, `cpu_ms<=250000`, and no D1/API writes.

## Live Execution Contract

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

The driver calls `POST /admin/schema/backfill/trigger`, polls staging D1 with `ubm-hyogo-db-staging --env staging --remote`, and writes JSON evidence matching `outputs/phase-3/evidence-schema.json`.
