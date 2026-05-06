# Output Phase 11: 手動 smoke / 実測 evidence template

## status

state: spec_created / NON_VISUAL / runtime PASS は別 wave で取得

## scope 宣言

本ファイルは **runtime evidence template + PASS 判定基準 + redact 規則** を仕様化する。本仕様書作成タスクでは実 secret 登録 / 実 test event 発火 / 実 Slack 通知発火を実行しない。実 evidence は user approval gate G-03 / G-04 通過後の **別 wave**（runtime execution wave）で取得する。

## redact 規則の宣言（全 evidence 共通）

- DSN URL（`https://<key>@<host>/<project>`）は base64 / hash でも記録しない。`redacted=YES` のみで存在を示す
- Slack webhook URL（`https://hooks.slack.com/services/...`）も同上
- Sentry auth token / Cloudflare API token は op:// 参照のみで実値を記録しない
- secret list の `value` 列は `***` mask
- Slack permalink の `T<workspace>/C<channel>/p<ts>` ID 形式は記録可（webhook URL ではないため）

## evidence 1: sentry-secret-list-redacted

| 項目 | 内容 |
| --- | --- |
| 取得コマンド | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` および `--env production`（G-03 通過後） |
| 期待 output 形式 | `name` / `type` 列のみ。`SENTRY_DSN_API` row が `secret_text` として 1 行表示 |
| redact 規則 | `value` 列が出る ver は `***` mask。出力に DSN URL が含まれていないことを `rg -n 'https://[^/]+@'` で確認 |
| PASS 条件 | staging / production 双方で `SENTRY_DSN_API` の name 行が存在 |
| 取得タイミング | staging secret put 直後 / G-03 通過後の production secret put 直後 |

## evidence 2: sentry-test-event-id

| 項目 | 内容 |
| --- | --- |
| 確認手順 | (a) `apps/api` の test endpoint で `Sentry.captureMessage('UBM staging smoke <ISO8601>')` を実行、または (b) curl envelope POST。SDK 経由を優先 |
| 記録項目 | event id（短縮 hex 8 桁）/ project name / timestamp（ISO8601）/ `dsn=redacted=YES` の表記 |
| 禁止事項 | DSN URL を絶対に記録しない。stack trace / user PII / form 回答 / Magic Link を含めない |
| PASS 条件 | event id が 1 件以上、送信から 60s 以内に Sentry dashboard で受信確認 |
| 取得タイミング | staging deploy 完了後の最初の smoke run |

## evidence 3: slack-secret-list-redacted

| 項目 | 内容 |
| --- | --- |
| 取得コマンド | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging`（同 production） |
| 期待 output 形式 | `SLACK_WEBHOOK_INCIDENT` の name 行が `secret_text` として表示 |
| redact 規則 | webhook URL を一切含まない。`hooks.slack.com` 文字列が出力に含まれないことを `rg` で確認 |
| PASS 条件 | staging / production 双方で `SLACK_WEBHOOK_INCIDENT` の name 行が存在 |

## evidence 4: slack-test-notification-evidence

| 項目 | 内容 |
| --- | --- |
| 送信内容 | test 文言例: `[STAGING SMOKE] UBM observability test <ISO8601>` |
| 受信時刻 | Slack timestamp（ISO8601 / JST）を記録 |
| channel | `#ubm-incident`（Phase 2 設計と整合） |
| permalink | Slack 右クリック → Copy link で取得した `https://<workspace>.slack.com/archives/C.../p...`。webhook URL ではないため記録可 |
| 禁止事項 | webhook URL を**絶対に**含めない。screenshot を取る場合は webhook 設定画面を写さない |
| PASS 条件 | message 着信を permalink で再現可能 |

## evidence 5: redaction-grep-result（AC-03 直結）

3 系統 grep を repo 全体（除外: `.git`, `node_modules`, `.next`, `dist`）に対し実行:

```
rg -n 'SENTRY_DSN assignment containing an https DSN' .
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+' .
rg -n 'sentry\.io/[0-9]+' .
```

| 項目 | 内容 |
| --- | --- |
| expected | 3 系統すべて exit code 1（no match） |
| PASS 条件 | 3 系統すべて 0 hit |
| FAIL 時の対応 | 即 rotation: Phase 2 「6.2 Sentry DSN rotation」または「6.3 Slack webhook revoke」を発火 |

## evidence 6: runbook-update-diff

| 項目 | 内容 |
| --- | --- |
| 対象 runbook | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/release-runbook.md` and `incident-response-runbook.md` |
| 更新前文言 | 「Sentry DSN: 未登録」「Slack webhook: 未登録」 |
| 更新後文言 | 「Sentry DSN: 実 secret 登録済（値は 1Password 正本 `op://UBM-Hyogo/Sentry · API DSN (<env>)/dsn`）」「Slack webhook: 実 secret 登録済（値は op://UBM-Hyogo/Slack · Incident Webhook (<env>)/url）」 |
| diff 取得方法 | `git diff -- docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` の出力を redact フィルタ通過後に保存 |
| PASS 条件 | placeholder「未登録」表記が 0 件、09c blocker reference が closed 候補としてマーク可能な状態 |

## evidence 7: user-approval-record

| 項目 | 記録形式 |
| --- | --- |
| approval timestamp | ISO8601 |
| 承認者 ID | user email を直接記録せず、agreed-on identifier（例: `daishiman` GitHub handle）または hash |
| 対象 gate | G-03（production secret 登録前）/ G-04（runbook 更新コミット前） |
| 対象 secret 名 | `SENTRY_DSN_API`, `SENTRY_DSN_WEB`, `SLACK_WEBHOOK_INCIDENT` 等の名前のみ |
| 承認文言 | user message の該当行を引用（実 URL / 実 token を含まないこと） |

## approval gate 運用

- G-03: staging smoke で AC-01 / AC-02 / AC-03 が PASS している evidence（上記 1〜5）を user が確認 → production secret put を許可
- G-04: runbook diff（evidence 6）の文言レビュー完了 → 09b runbook の placeholder 更新コミットを許可

## 本仕様書作成タスクの境界宣言

- 本ファイル作成段階では evidence 1〜7 の実体ファイル（`sentry-secret-list-redacted.md` 等）を **作成しない**
- 後続 runtime execution wave で本ファイルを参照しながら 7 種 evidence を実体化する
- 仕様書作成タスクは「template + 規則の確定」までで完了とし、`spec_created` 状態を維持する

## notes

このファイルは Phase 1 AC・Phase 2 設計・Phase 3 review GO 判定を前提とした template であり、実 secret 登録 / 実 deploy / 実 smoke の実行結果ではない。実行責任は後続 runtime wave に委ねる。
