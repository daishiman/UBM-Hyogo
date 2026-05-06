# Phase 12 Implementation Guide

## Part 1: 中学生レベル

Sentry は、Web アプリや API でエラーが起きたときに「どこで、いつ、何が起きたか」を見つけるための道具です。Slack 通知は、その異常を人が気づける場所へ知らせるための道具です。

このタスクでは、Sentry や Slack の本物の秘密の URL をファイルに書きません。秘密の URL が漏れると、知らない人が勝手にエラー送信や通知送信をできるためです。ファイルには `op://...` という 1Password の参照名と、Cloudflare に登録する secret 名だけを書きます。

approval gate は「人が確認してから本番に進むための止めどころ」です。staging で Sentry event と Slack message が届き、秘密が漏れていないことを確認してから production secret 登録へ進みます。

## Part 2: 技術者レベル

### Secret Names

| Secret | Owner | Environment | Use |
| --- | --- | --- | --- |
| `SENTRY_DSN_API` | `apps/api` | staging / production | API Worker の Sentry SDK DSN |
| `SENTRY_DSN_WEB` | `apps/web` | staging / production | Web Worker の Sentry SDK DSN |
| `SLACK_WEBHOOK_INCIDENT` | `apps/api` | staging / production | incident alert 用 Incoming Webhook |
| `SLACK_WORKFLOW_URL` | `apps/api` | staging / production | optional workflow endpoint。未採用なら配置しない |

旧 `SLACK_ALERT_WEBHOOK_URL` は monitoring 設計由来の汎用名として残る。09b-A では incident response 用の正本名を `SLACK_WEBHOOK_INCIDENT` とし、旧名を新規実装で増やさない。

### 1Password References

| Secret | 1Password reference pattern |
| --- | --- |
| `SENTRY_DSN_API` | `op://UBM-Hyogo/Sentry API DSN (<env>)/dsn` |
| `SENTRY_DSN_WEB` | `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn` |
| `SLACK_WEBHOOK_INCIDENT` | `op://UBM-Hyogo/Slack Incident Webhook (<env>)/url` |
| `SLACK_WORKFLOW_URL` | `op://UBM-Hyogo/Slack Incident Workflow (<env>)/url` |

実値、実値 hash、DSN host/project id、webhook URL は evidence に残さない。

### Runtime Smoke Flow

1. staging secret を `op read ... | bash scripts/cf.sh secret put <NAME> --config <wrangler.toml> --env staging` で登録する。
2. `bash scripts/cf.sh secret list --config <wrangler.toml> --env staging` で name-only evidence を取得する。
3. Sentry SDK 経由で `UBM staging smoke <ISO8601>` の test event を発火し、event id と timestamp のみ記録する。
4. Slack incident webhook 経由で `[STAGING SMOKE] UBM observability test <ISO8601>` を送信し、permalink と timestamp のみ記録する。
5. Phase 11 の 3 系統 grep gate を実行し、0 hit を確認する。
6. user approval G-04 後に production secret 登録へ進む。

### Runtime Placement

| Area | Placement | Notes |
| --- | --- | --- |
| API Worker secrets | `apps/api/wrangler.toml` staging / production env | `SENTRY_DSN_API`, `SLACK_WEBHOOK_INCIDENT`, optional `SLACK_WORKFLOW_URL` |
| Web Worker secrets | `apps/web/wrangler.toml` staging / production env | `SENTRY_DSN_WEB` |
| API Sentry smoke | `apps/api/src/routes/admin/smoke-observability.ts` | `POST /admin/smoke/observability?target=sentry` sends a redaction-safe Sentry envelope from `SENTRY_DSN_API` |
| API Slack smoke | `apps/api/src/routes/admin/smoke-observability.ts` | `POST /admin/smoke/observability?target=slack` posts a test message through `SLACK_WEBHOOK_INCIDENT` |
| Route mount | `apps/api/src/index.ts` | `/admin/smoke/observability`; production returns 404; dev/staging require `SMOKE_ADMIN_TOKEN` |
| Slack notifier | Incident-response path owned by API Worker / 09b runbook | Use `SLACK_WEBHOOK_INCIDENT`, not legacy `SLACK_ALERT_WEBHOOK_URL` |

### Rotation / Rollback

| Trigger | Action | Evidence |
| --- | --- | --- |
| DSN or webhook literal appears in repo/evidence | Revoke or rotate provider secret, then replace Cloudflare secret from 1Password | `redaction-grep-result.md`, `runbook-update-diff.md` |
| Staging smoke fails after secret update | Delete or overwrite staging secret, rerun name-only `secret list`, keep runtime PASS blocked | `manual-smoke-log.md` |
| Production registration requested | Require G-03 approval after staging Sentry / Slack / redaction PASS | `user-approval-record.md` |

### Internal Links

- Phase 2: `../../phase-02/main.md`
- Phase 5: `../../phase-05/main.md`
- Phase 11: `../phase-11/main.md`
- System spec summary: `system-spec-update-summary.md`

## Completion

この guide は runbook formalization 用の initial 版であり、runtime PASS ではない。runtime execution wave で実 evidence が取得された場合だけ、実行結果への参照を追記する。
