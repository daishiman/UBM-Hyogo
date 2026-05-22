# Phase 1 Output — 要件定義 / Gate 整理

仕様書: `../../phase-01.md`

## 確定スコープ

`scripts/cf-audit-log/observation/fallback-rate-alert.ts` に **dispatcher 層**を追加する。閾値（5%）/ window（3h）/ evaluator は親 #549 の運用合意のため不変。新 channel provisioning や mail provider 選定はスコープ外。

## 確定要件

- R-1: `defaultSlackDispatcher` / `defaultMailDispatcher` を export
- R-2: `evaluateAndAlert` に `slackWebhookUrl?` / `emailWebhookUrl?` / `emailFrom?` / `emailTo?` を optional 追加
- R-3: `redactForNotification(text)` を export（hash / userId / tenantId / Bearer / hooks.slack.com の 5 ルール）
- R-4: dry-run 時は HTTP fetch を一切呼ばず stdout に payload 出力
- R-5: 既存 unit test 無修正 PASS
- R-6: `.github/workflows/cf-audit-log-monitor.yml` の job env に canonical `SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` / `EMAIL_FROM` / `EMAIL_TO` を追加

## Failure isolation 方針

- GitHub Issue 起票: **必須**（throw 伝播で workflow を fail させる）
- Slack dispatcher: **best-effort**（try/catch で握り `slackError` に格納、他系統継続）
- Mail dispatcher: **best-effort**（同上）
- env 未設定時: 該当 dispatcher を no-op で skip（実装は phase-05 で確定）

Gate 通過。Phase 2 設計に進行。
