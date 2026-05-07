# Runbook: Schema Alias Back-fill — 50k Staging Stress Trial (Issue #504)

> **Audience**: on-call engineer running the issue-504 staging stress trial after user gate approval.
> **Scope**: staging only. production bulk INSERT/DELETE is permanently banned.

## 1. Pre-flight

```bash
bash scripts/cf.sh whoami
test -f apps/api/src/workflows/schemaAliasBackfillBatch.ts
test -f apps/api/src/repository/schemaDiffQueue.ts
which bats shellcheck && pnpm -w exec vitest --version
```

Confirm:
- `CLOUDFLARE_ENV` is **not** `production` in your shell.
- Parent gate evidence exists at
  `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`.

## 2. Generate Fixture

```bash
mise exec -- pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts \
  --count 50000 --format sql --output /tmp/fixture-50k.sql
wc -l /tmp/fixture-50k.sql
sha256sum /tmp/fixture-50k.sql  # record in evidence
```

Re-running with the same `--count` MUST produce a byte-identical file (deterministic).

## 3. Seed staging D1

```bash
bash scripts/schema-alias-backfill/seed-staging-50k.sh \
  --env staging --fixture-file /tmp/fixture-50k.sql --dry-run

# user gate: review plan, then re-run without --dry-run
bash scripts/schema-alias-backfill/seed-staging-50k.sh \
  --env staging --fixture-file /tmp/fixture-50k.sql
```

Verify count:

```sql
SELECT COUNT(*) FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%';
-- expected: 50000
```

## 4. Run 10 Trials

For each `trial in 1..10`:

1. Drain queue depth to 0 (manual: wait for `backfill_status` to settle).
2. Trigger:
   ```bash
   curl -fsS -X POST \
     -H "Authorization: Bearer ${ADMIN_SESSION_JWT:?}" \
     -H "Content-Type: application/json" \
     --data '{"source":"issue-504-50k-trial"}' \
     "${ADMIN_API_BASE_URL%/}/admin/schema/backfill/trigger"
   ```
3. Poll every **10s**, max **1800s**:
   - retry_count
   - cpu_ms
   - queue_enqueued
   - dlq_count
   - backfill_status
4. Abort thresholds (any breach = `exhausted` for that trial):
   - `retry_count > 3`
   - `dlq_count > 0`
   - `cpu_ms > 250000`
   - timeout exceeded

Append each trial result to the JSON evidence following
`docs/30-workflows/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-3/evidence-schema.json`.

To pre-write the schema skeleton:

```bash
bash scripts/schema-alias-backfill/run-stress-trial.sh \
  --trials 10 --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 --timeout-seconds 1800 \
  --api-base-url "$ADMIN_API_BASE_URL" \
  --evidence-out /tmp/evidence-50k.json --dry-run
```

After user approval, export an admin session JWT for staging and remove `--dry-run`:

```bash
export ADMIN_API_BASE_URL="https://<staging-api-host>"
export ADMIN_SESSION_JWT="<admin-session-jwt>"
bash scripts/schema-alias-backfill/run-stress-trial.sh \
  --trials 10 --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 --timeout-seconds 1800 \
  --api-base-url "$ADMIN_API_BASE_URL" \
  --evidence-out /tmp/evidence-50k.json
```

## 5. Cleanup

```bash
bash scripts/schema-alias-backfill/cleanup-staging-50k.sh --env staging              # dry-run
bash scripts/schema-alias-backfill/cleanup-staging-50k.sh --env staging --confirm    # delete
```

Cleanup is a Phase 11 gate close-out condition.

## 6. Redaction Check

```bash
rg "@gmail|@senpai-lab|token|secret" \
  docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/
# expected: no matches
```

## 7. Record Evidence

Write the redaction-clean JSON evidence to:

```
docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md
```

Then mark the parent workflow Phase 11 gate close-out complete.
