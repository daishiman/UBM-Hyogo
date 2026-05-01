# task-obs-sentry-dsn-registration-001 - Sentry DSN registration and smoke

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-obs-sentry-dsn-registration-001 |
| タスク名 | Sentry DSN registration and smoke |
| 分類 | operations / observability / secrets |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## Why

09b release runbook は `SENTRY_DSN` を placeholder として扱うが、実 DSN の Cloudflare Secrets 登録、staging smoke、production 反映手順は未実施である。放置すると incident response runbook の error tracking 導線が手動ログ確認に偏り、P1/P2 検知が遅れる。

## What

- `SENTRY_DSN` を 1Password 正本から Cloudflare Workers / Pages の staging・production secrets に同期する
- staging で意図的な test event を送信し、Sentry project 上で受信を確認する
- 実 DSN を docs / logs / PR body に残さない運用を `deployment-secrets-management.md` と整合させる
- 09b `release-runbook.md` の placeholder を「実 secret 登録済み、値は非公開」に更新する

## Scope

含む:
- Cloudflare secret 登録 runbook
- staging smoke evidence
- rollback / secret rotation 手順
- aiworkflow-requirements の references / indexes 同期

含まない:
- Sentry paid plan 契約
- Slack / PagerDuty 連携
- unrelated observability dashboard 改修

## 完了条件

- [ ] staging / production の `SENTRY_DSN` secret 登録手順が証跡化されている
- [ ] staging test event が Sentry で確認済み
- [ ] 実 DSN が repository に残っていないことを `rg 'SENTRY_DSN=.*https://'` 等で確認済み
- [ ] 09b release / incident runbook の placeholder 状態が更新済み
