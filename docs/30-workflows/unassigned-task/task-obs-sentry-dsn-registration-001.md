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

## 苦戦箇所【記入必須】

Sentry DSN は secret 値そのものを evidence に残せないため、登録済み証跡と値非公開の両立が難しい。`bash scripts/cf.sh secret list`、Sentry test event の event id、`rg` による漏洩確認を evidence とし、DSN 実値は 1Password 正本に限定する。

## スコープ

含む:
- Cloudflare secret 登録 runbook
- staging smoke evidence
- rollback / secret rotation 手順
- aiworkflow-requirements の references / indexes 同期

含まない:
- Sentry paid plan 契約
- Slack / PagerDuty 連携
- unrelated observability dashboard 改修

## リスクと対策

| リスク | 対策 |
| --- | --- |
| DSN 実値が docs / logs に混入する | `rg 'SENTRY_DSN=.*https://'` と secret list の値非表示 evidence を必須化する |
| staging test event が production project に送られる | staging / production project と DSN を 1Password item 名で分離する |
| Sentry plan / retention 判断が scope を膨らませる | 本タスクは DSN 登録と smoke のみ扱い、plan 変更は別承認にする |

## 検証方法

- `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging`
- Sentry dashboard で test event id を確認
- `rg -n "SENTRY_DSN=.*https://|sentry.io/[0-9]" .`

## 完了条件

- [ ] staging / production の `SENTRY_DSN` secret 登録手順が証跡化されている
- [ ] staging test event が Sentry で確認済み
- [ ] 実 DSN が repository に残っていないことを `rg 'SENTRY_DSN=.*https://'` 等で確認済み
- [ ] 09b release / incident runbook の placeholder 状態が更新済み
