# Smoke Scripts

## tag-queue-race.mjs

`tag-queue-race.mjs` verifies that concurrent resolves for the same tag queue item produce exactly one winner and `race_lost` losers.

Run a local dry run without sending HTTP:

```bash
node scripts/smoke/tag-queue-race.mjs \
  --dry-run \
  --env staging \
  --queue-id qf_race_example \
  --base-url https://api-staging.example.invalid \
  --session-cookie "$(op read 'op://Vault/Staging/admin_cookie')" \
  --action confirmed \
  --tag-codes sample-tag
```

Run the staging smoke after creating a queued fixture in staging D1:

```bash
COOKIE="$(op read 'op://Vault/Staging/admin_cookie')"
OUT="docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/$(date -u +%Y-%m-%dT%H-%M-%SZ)/result.json"

node scripts/smoke/tag-queue-race.mjs \
  --env staging \
  --queue-id "$QUEUE_ID" \
  --concurrency 5 \
  --base-url "$STAGING_API_BASE" \
  --session-cookie "$COOKIE" \
  --action confirmed \
  --tag-codes "$TAG_CODE" \
  --out "$OUT"
```

The evidence file contains redacted options, aggregate analysis, and per-request status/body/timing. It does not write the session cookie.

To include AC-4 side-effect validation in the runner exit code, create a summary from the Phase 11 before/after SQL:

```json
{
  "expected": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" },
  "actual": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" }
}
```

Then run:

```bash
node scripts/smoke/tag-queue-race.mjs \
  --analyze-only \
  --input "$OUT" \
  --side-effect-input "$SIDE_EFFECT_SUMMARY"
```

Run focused tests:

```bash
bash scripts/smoke/__tests__/tag-queue-race.test.sh
```
