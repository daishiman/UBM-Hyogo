# Output Phase 5: 実装ランブック（確定）

## status

RUNBOOK_CONFIRMED / NOT_EXECUTED

## taskType / 実装区分

[実装区分: ドキュメントのみ] / docs-only / spec_created / remaining-only。
本ファイルは spec として確定する runbook であり、実 secret 登録・smoke 実行は Phase 11 で行う。

## secret 命名対応表（Phase 2 から re-export）

| 用途 | secret 名 | scope（wrangler.toml） | env | 1Password 参照 |
| --- | --- | --- | --- | --- |
| Workers API Sentry DSN | `SENTRY_DSN_API` | `apps/api/wrangler.toml` | staging | `op://UBM-Hyogo/Sentry · API DSN (staging)/dsn` |
| Workers API Sentry DSN | `SENTRY_DSN_API` | `apps/api/wrangler.toml` | production | `op://UBM-Hyogo/Sentry · API DSN (production)/dsn` |
| Workers Web Sentry DSN | `SENTRY_DSN_WEB` | `apps/web/wrangler.toml` | staging | `op://UBM-Hyogo/Sentry · Web DSN (staging)/dsn` |
| Workers Web Sentry DSN | `SENTRY_DSN_WEB` | `apps/web/wrangler.toml` | production | `op://UBM-Hyogo/Sentry · Web DSN (production)/dsn` |
| Slack Incident webhook | `SLACK_WEBHOOK_INCIDENT` | `apps/api/wrangler.toml` | staging / production | `op://UBM-Hyogo/Slack · Incident Webhook (<env>)/url` |
| Slack Workflow trigger（optional） | `SLACK_WORKFLOW_URL` | `apps/api/wrangler.toml` | staging / production | `op://UBM-Hyogo/Slack · Workflow Trigger (<env>)/url` |

## Step 0: SLACK secret 命名整合性の確定（forward 課題吸収）

- 対象: `SLACK_ALERT_WEBHOOK_URL`（既存正本） ⇆ `SLACK_WEBHOOK_INCIDENT`（本タスク追加）
- 確定方針: **`SLACK_WEBHOOK_INCIDENT` を新規正本として追加 + `SLACK_ALERT_WEBHOOK_URL` を deprecation 表記**
- 検証: `rg -n 'SLACK_ALERT_WEBHOOK_URL' apps/ docs/`
- before invariant: 既存 references が `SLACK_ALERT_WEBHOOK_URL` を参照している
- after invariant: 旧名参照箇所と deprecation 期限が `outputs/phase-05/main.md` の「Step 0 決定ログ」（後続実行者が追記）に列挙される
- 所要時間目安: 10〜20 分
- 失敗時戻り先: 旧名参照コードが多い場合は本タスクと別 PR で置換、本タスクは追加のみで進行

## Step 1: 1Password item 確認

- 対象: vault `UBM-Hyogo` 配下の Sentry / Slack item 8 件（Phase 2 表）
- 検証: `op item list --vault UBM-Hyogo`（実値は表示しない）
- before invariant: vault 自体が存在
- after invariant: 8 item の存在確認 OK、または GUI で人間が登録完了
- 所要時間目安: 10〜30 分（GUI 登録が必要な場合）
- 失敗時戻り先: item 未登録なら Phase 6 A-03 escalate 経由で人間に GUI 登録依頼

## Step 2: staging secret 登録

- 対象: `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT`（staging）
- コマンド例（実値は標準入力経由のみ・shell history に残さない）:
  ```bash
  op read 'op://UBM-Hyogo/Sentry · API DSN (staging)/dsn' \
    | bash scripts/cf.sh secret put SENTRY_DSN_API \
      --config apps/api/wrangler.toml --env staging
  ```
  同様に `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` を順次配置
- before invariant: T-01 / T-03 で取得した pre-state list（対象 secret 名なし）
- after invariant: `bash scripts/cf.sh secret list --config <wrangler.toml> --env staging` の値非表示出力に対象 secret 名が出現
- evidence: `outputs/phase-11/sentry-secret-list-redacted.md` / `outputs/phase-11/slack-secret-list-redacted.md`
- 所要時間目安: 10〜20 分
- 失敗時戻り先: Phase 6 A-03

## Step 3: staging Sentry test event 発火（T-02）

- 対象: staging API Worker
- コマンド例: `apps/api` 内の test endpoint（後続で確定）または `Sentry.captureMessage('UBM staging smoke ' + new Date().toISOString())` を 1 回実行
- before invariant: Sentry project Issues に当該 message が未表示
- after invariant: 60s 以内に Issues に新規 event 出現、event id（短縮 hex）取得可
- evidence: `outputs/phase-11/sentry-test-event-id.md`（id と timestamp のみ・DSN URL 完全 redact）
- 所要時間目安: 5〜10 分
- 失敗時戻り先: Phase 6 A-01

## Step 4: staging Slack test notification 発火（T-04）

- 対象: staging incident webhook
- コマンド例:
  ```bash
  op read 'op://UBM-Hyogo/Slack · Incident Webhook (staging)/url' \
    | xargs -I{} curl -sS -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"UBM staging smoke $(date -u +%FT%TZ)\"}" {}
  ```
  （実 URL は `xargs` 経由で渡し、`ps` / shell history に残さない）
- before invariant: 対象チャンネルに当該 message が未表示
- after invariant: Slack `#ubm-incident` (staging) に message delivered、timestamp 取得可
- evidence: `outputs/phase-11/slack-test-notification-evidence.md`（permalink の workspace 識別子は redact）
- 所要時間目安: 5 分
- 失敗時戻り先: Phase 6 A-02

## Step 5: redaction grep（T-05）

- 対象: repo 全体
- コマンド:
  ```bash
  rg -n 'SENTRY_DSN assignment containing an https DSN|sentry\.io/[0-9]+/[0-9]+' . > /tmp/grep-sentry.txt
  rg -n 'hooks\.slack\.com|SLACK_.*=.*https://' .          > /tmp/grep-slack.txt
  rg -n 'xox[bp]-' .                                        > /tmp/grep-token.txt
  ```
- before invariant: Step 3 / Step 4 で発火した evidence を保存済み
- after invariant: 3 系統すべて 0 件、`outputs/phase-11/redaction-grep-result.md` に「全 0 件」を記録
- 失敗時戻り先: Phase 6 A-04（即時。test 続行禁止）

## Step 6: production secret 登録（G-03 通過後のみ）

- 対象: `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT`（production）
- 前提: Step 2〜5 が staging で PASS、人間による G-03 approval 取得済み
- コマンド: Step 2 と同様、`--env production` に切り替え + 1Password 参照を `(production)` 側に
- before invariant: production 側 `secret list` に対象 secret 名なし
- after invariant: production 側 `secret list` に対象 secret 名出現
- evidence: `outputs/phase-11/sentry-secret-list-redacted.md` / `outputs/phase-11/slack-secret-list-redacted.md`（production 節）
- 失敗時戻り先: Phase 6 A-03 / A-06

## Step 7: 09b 既存 runbook placeholder 更新（G-04 通過後）

- 対象ファイル:
  - `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/release-runbook.md`
  - `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/incident-response-runbook.md`
- 更新内容: placeholder「未登録」→ 「実 secret 登録済み（実値は 1Password 正本）」
- before invariant: 該当 placeholder が「未登録」表記
- after invariant: 上記文言に更新、実値は記載されない（grep で再確認）
- evidence: `outputs/phase-12/runbook-diff.md`
- 失敗時戻り先: Phase 6 A-05

## 全体 invariant（タスク終了時）

- secret 実値は repo / evidence / log / PR body に存在しない（T-05 で都度検証）
- 1Password 正本のみが実値を保持
- production 側は staging PASS 後の G-03 通過時のみ更新

## 失敗時の戻り先（Phase 6 異常系へのリンク）

| 失敗パターン | 異常系 ID |
| --- | --- |
| Sentry test event 受信失敗 | A-01 |
| Slack test notification 不着 | A-02 |
| secret put 失敗 | A-03 |
| redaction grep が hit | A-04 |
| 既存 runbook 整合不整合 | A-05 |
| production への staging 値混入 | A-06 |
