# Smoke Scripts

## runtime-admin-web.sh

`runtime-admin-web.sh` verifies an authenticated `/admin` page response and Workers tail output for the web Worker. It accepts only `staging` or `production`.

```bash
# Staging uses STAGING_WEB_BASE and STAGING_ADMIN_SESSION_COOKIE.
bash scripts/smoke/runtime-admin-web.sh staging --out-dir ci-evidence --ci-summary

# Production uses PRODUCTION_WEB_BASE and PRODUCTION_ADMIN_SESSION_COOKIE.
bash scripts/smoke/runtime-admin-web.sh production --out-dir ci-evidence --ci-summary
```

`mint-staging-session-cookie.mts` keeps the historical filename for compatibility. Run it with no env argument for staging, or with `production` to read `PRODUCTION_AUTH_SECRET`, `PRODUCTION_ADMIN_MEMBER_ID`, and `PRODUCTION_ADMIN_EMAIL`.

```bash
GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-session-cookie.mts production
```

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
