# UT-17 Documentation Changelog

## Entry Checklist

- `git status --porcelain apps/ packages/`: UT-17 `apps/api` implementation files are present in this cycle.
- `git diff --name-only -- docs/30-workflows/ut-17-cloudflare-analytics-alerts`: workflow package plus Phase 12 close-out updates.

## Added

- `artifacts.json`
- `outputs/artifacts.json`
- Phase 1-3 output files
- Phase 12 strict 7 output files
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/lib/cf-webhook-auth.ts`
- `apps/api/src/lib/cloudflare-alert-formatter.ts`
- `apps/api/src/lib/slack-sender.ts`
- `apps/api/src/middleware/verify-cf-webhook-auth.ts`
- UT-17 focused tests under `apps/api/src/lib/__tests__/` and `apps/api/src/routes/internal/__tests__/`

### Runbook（新規）

- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` — Cloudflare 無料枠アラート受信時の一次対応フロー（メトリクス特定 → Dashboard 確認 → 緩和 / スケール判断）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — 月次 webhook 生死確認手順（Slack Webhook URL revoke の silent failure 検出）

## Corrected

- Replaced body-HMAC design with Cloudflare `cf-webhook-auth` fixed-secret design.
- Split Free baseline email alerts from Pro+/eligible webhook relay.
- Corrected 01b Cloudflare topology reference to completed-tasks path.
- Corrected api package command filter to `@ubm-hyogo/api`.
- Reclassified workflow state from `spec_created` to `implementation_completed_external_ops_pending` after local code implementation was detected.
- Replaced stale Phase 11 screenshot requirements with NON_VISUAL skip evidence.
- Added Slack 429 retry, redacted Slack failure responses, env-driven Dashboard/runbook links, and 5-minute duplicate alert suppression.
