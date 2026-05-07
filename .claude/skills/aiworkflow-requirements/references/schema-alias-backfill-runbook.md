# Schema Alias Back-fill Runbook

## Issue #504 50k Stress Trial Contract

| Item | Contract |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/` |
| status | `spec_created / implementation / NON_VISUAL / staging stress trial user-gated` |
| script owner | `scripts/schema-alias-backfill/` |
| issue policy | Issue #504 remains CLOSED; PR text uses `Refs #504` only |
| production policy | production bulk INSERT / DELETE is permanently banned |

## Fixture Identity

50,000 row fixture records use this deterministic key shape:

```text
ubm-test-fixture-50k-${index.toString().padStart(7, "0")}-${sha256(String(index)).slice(0, 12)}
```

The prefix `ubm-test-fixture-50k-` is the only cleanup/count selector:

```sql
WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'
```

Hash-only `dedupe_key` values are forbidden for this fixture because they make deterministic cleanup and trial isolation ambiguous.

## Runtime Trigger

Stress trial execution is user-gated and staging-only:

```bash
bash scripts/schema-alias-backfill/run-stress-trial.sh \
  --trials 10 \
  --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 \
  --timeout-seconds 1800 \
  --evidence-out /tmp/evidence-50k.json
```

The driver triggers the staging endpoint via a direct `curl` call using `ADMIN_SESSION_JWT` (the `cf.sh api-post` form does not pass the admin session and is not a valid trigger path). The exact contract is:

```bash
curl --silent --show-error --fail-with-body \
  --request POST "${ADMIN_API_BASE_URL}/admin/schema/backfill/trigger" \
  --header "authorization: Bearer ${ADMIN_SESSION_JWT}" \
  --header "content-type: application/json" \
  --data '{"source":"issue-504-50k-trial"}'
```

`ADMIN_API_BASE_URL` and `ADMIN_SESSION_JWT` must be exported by the operator before invoking `scripts/schema-alias-backfill/run-stress-trial.sh`. Scheduled waiting is not an alternate canonical path for Issue #504 evidence.

## Abort Gates

| Metric | PASS boundary |
| --- | --- |
| `retry_count` | `<= 3` per trial |
| `dlq_count` | `0` |
| `cpu_ms` | `<= 250000` |
| timeout | `1800s` |
| pass status | `backfill_status=completed` |
| partial status | threshold breach or `backfill_status=exhausted`, with abort reason recorded |

## Evidence

Runtime evidence is written after user approval to:

`docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md`

Before close-out, run redaction checks against the parent evidence root:

```bash
rg "@gmail|@senpai-lab|token|secret" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/
```

No secret values, token IDs, real user IDs, real emails, or production D1 writes may be recorded in evidence.

## Manual Fallback Runbook

For step-by-step manual operations (pre-flight, generate, seed, run trials, cleanup, redaction, record evidence), follow:

`docs/runbooks/schema-alias-backfill-50k-stress-trial.md`

