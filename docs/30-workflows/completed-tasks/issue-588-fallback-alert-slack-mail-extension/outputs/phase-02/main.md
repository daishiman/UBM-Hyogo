# Phase 2 Output — 設計

仕様書: `../../phase-02.md`

## 結果

`scripts/cf-audit-log/observation/fallback-rate-alert.ts` 単一モジュール内に以下を確定した（新規ファイル無し）。

- `redactForNotification(text)` — hash / userId / tenantId / Bearer / hooks.slack.com を順次マスク
- `buildNotificationPayload(evaluation, threshold, window)` — `buildIssueBody` を redact して `{title, text}` を返却
- `SlackDispatcher` / `MailDispatcher` インターフェース + `defaultSlackDispatcher` / `defaultMailDispatcher` 実装
- `evaluateAndAlert` を拡張: Issue 起票後に Slack → mail を try/catch で順次呼び、失敗は握って結果に `slackError` / `mailError` を載せる（best-effort）
- dry-run 時は payload を stdout に出力して HTTP を一切呼ばない

env 命名は canonical `SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` / `EMAIL_FROM` / `EMAIL_TO`。CLI は local fallback として `SLACK_WEBHOOK_URL` も読む。Slack の正本は Issue #520 の `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` を流用、mail webhook は provision pending（未設定時 dispatcher は no-op）。

実コード反映は phase-05 / phase-11 evidence を参照。
