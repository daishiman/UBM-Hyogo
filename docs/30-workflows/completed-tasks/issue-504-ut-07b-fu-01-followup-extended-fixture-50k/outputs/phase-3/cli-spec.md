# Phase 3 CLI Spec

## Commands

| Command | Purpose | Runtime writes |
| --- | --- | --- |
| `pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts --count 50000 --output /tmp/fixture-50k.sql` | Generate deterministic synthetic SQL fixture. | No |
| `bash scripts/schema-alias-backfill/seed-staging-50k.sh --env staging --fixture-file /tmp/fixture-50k.sql` | Seed staging D1 only. | Staging only |
| `bash scripts/schema-alias-backfill/cleanup-staging-50k.sh --env staging --confirm` | Remove rows matching `dedupe_key LIKE 'ubm-test-fixture-50k-%'`. | Staging only |
| `ADMIN_SESSION_JWT=... bash scripts/schema-alias-backfill/run-stress-trial.sh --trials 10 --trigger-path /admin/schema/backfill/trigger --poll-interval-seconds 10 --timeout-seconds 1800 --api-base-url "$ADMIN_API_BASE_URL" --evidence-out /tmp/evidence-50k.json` | Run 10 staging stress trials and write JSON evidence. | Staging only |

## Dedupe Key Contract

`dedupe_key = ubm-test-fixture-50k-${index.toString().padStart(7, "0")}-${sha256(String(index)).slice(0, 12)}`

The prefix `ubm-test-fixture-50k-` is mandatory. Count, cleanup, and redaction verification use the same selector:

```sql
WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'
```

## Trigger Contract

Stress trial trigger uses exactly:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer ${ADMIN_SESSION_JWT:?}" \
  -H "Content-Type: application/json" \
  --data '{"source":"issue-504-50k-trial"}' \
  "${ADMIN_API_BASE_URL%/}/admin/schema/backfill/trigger"
```

Expected response:

```json
{"accepted":true,"status":"pending"}
```

Accepted status values are `pending` and `running`. Any non-2xx response, malformed JSON, or `accepted !== true` fails the trial.

## Polling and Abort Gates

| Gate | Value |
| --- | --- |
| poll interval | 10 seconds |
| timeout | 1800 seconds |
| max retry_count | 3 |
| max dlq_count | 0 |
| max cpu_ms | 250000 |
| pass status | `completed` |
| partial status | `exhausted` or threshold breach with evidence |
