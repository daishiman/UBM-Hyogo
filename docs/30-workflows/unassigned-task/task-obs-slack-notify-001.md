# task-obs-slack-notify-001 - Incident Slack notification automation

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-obs-slack-notify-001 |
| タスク名 | Incident Slack notification automation |
| 分類 | operations / observability / incident-response |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## Why

09b incident response runbook は manual escalation を定義しているが、Slack 通知の自動発火条件と webhook / workflow の登録は未実施である。放置すると `sync_jobs.failed` 連続や stale running の検知が人手確認に依存し、初動が遅れる。

## What

- P1/P2 の自動通知条件を定義する
- Slack webhook または Slack workflow の secret 配置手順を作る
- `sync_jobs.failed` 連続、`running` 30 分超、Workers 5xx rate などを通知対象にする
- staging で通知 smoke を行い、incident-response-runbook に反映する

## 苦戦箇所【記入必須】

Slack 通知は「便利な自動化」と「誤通知による alert fatigue」の境界が曖昧になりやすい。09b の manual escalation を壊さず、P1/P2 の最小条件だけを staging smoke で確認してから production に進める。

## スコープ

含む:
- 通知条件 matrix
- secret / variable 配置
- staging smoke
- false positive 抑制ルール

含まない:
- PagerDuty / Opsgenie 等の外部 on-call 製品導入
- Sentry 本接続（`task-obs-sentry-dsn-registration-001` で扱う）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| failed job の一時的な揺れで大量通知される | 連続失敗回数、dedupe window、severity gate を matrix 化する |
| webhook secret が repo に混入する | 1Password 正本 + Cloudflare Secret / GitHub Secret のみで管理する |
| manual escalation と自動通知の責務が競合する | incident response runbook に初動 owner と自動通知の補助範囲を明記する |

## 検証方法

- staging で test notification を 1 回送る
- dedupe 条件の dry-run log を保存する
- `rg -n "hooks.slack.com|SLACK_.*=.*https://" .` で漏洩がないことを確認する

## 完了条件

- [ ] 通知条件 matrix が runbook に反映されている
- [ ] Slack secret が 1Password 正本から配置され、実値が repo に残っていない
- [ ] staging smoke で test notification を確認済み
- [ ] incident response runbook に手動通知と自動通知の責務境界が明記されている
