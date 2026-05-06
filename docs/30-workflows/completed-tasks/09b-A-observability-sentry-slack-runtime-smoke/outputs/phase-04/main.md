# Output Phase 4: テスト戦略（確定）

## status

TEST_STRATEGY_CONFIRMED / NOT_EXECUTED

## taskType / 実装区分

[実装区分: ドキュメントのみ] / docs-only / spec_created / remaining-only。
本ファイルは spec として確定する Test ID 表のみを保持し、実 evidence は Phase 11 で取得する。

## テストケース表

| Test ID | 種別 | 対象 | 実コマンド | expected | evidence path | approval gate |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | 手順 dry-run | Sentry secret 登録 pre-state | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` / 同 `apps/web/wrangler.toml` | `SENTRY_DSN_API` / `SENTRY_DSN_WEB` が list に含まれない（pre-state baseline） | `outputs/phase-11/sentry-secret-list-redacted.md`（pre-state 節） | G-02 直前 |
| T-02 | smoke 受信 | Sentry test event 受信 | `apps/api` test endpoint（Phase 5 で確定）または `Sentry.captureMessage('UBM staging smoke ' + ISO8601)` を staging で 1 回 | Sentry project Issues に新規 event が 60s 以内に表示、event id を取得可能 | `outputs/phase-11/sentry-test-event-id.md`（id のみ。DSN URL は記録しない） | G-02 通過後 |
| T-03 | 手順 dry-run | Slack secret 登録 pre-state | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` | `SLACK_WEBHOOK_INCIDENT` が list に含まれない（pre-state baseline） | `outputs/phase-11/slack-secret-list-redacted.md`（pre-state 節） | G-02 直前 |
| T-04 | smoke 受信 | Slack test notification 受信 | `op read 'op://UBM-Hyogo/Slack · Incident Webhook (staging)/url' \| xargs -I{} curl -sS -X POST -H 'Content-Type: application/json' -d '{"text":"UBM staging smoke <ISO8601>"}' {}`（実 URL は標準入力経由で渡し、shell history / log には残さない） | Slack `#ubm-incident` (staging 相当) に message delivered、permalink 取得可能 | `outputs/phase-11/slack-test-notification-evidence.md`（permalink は redact） | G-02 通過後 |
| T-05 | redaction grep | repo 全体の secret 漏洩検査 | `rg -n 'SENTRY_DSN assignment containing an https DSN\|sentry\.io/[0-9]+/[0-9]+' .` / `rg -n 'hooks\.slack\.com\|SLACK_.*=.*https://' .` / `rg -n 'xox[bp]-' .` | 3 系統すべて 0 件 | `outputs/phase-11/redaction-grep-result.md` | T-02 / T-04 完了後・各 commit 候補前 |
| T-06 | rollback 往復 | secret put→delete 往復 | （dummy 値での往復 dry-run）`scripts/cf.sh secret put TEST_DUMMY --config apps/api/wrangler.toml --env staging`（stdin に dummy）→ `secret list`（存在）→ `secret delete TEST_DUMMY ...` → `secret list`（不在） | put 後 list に出現、delete 後 list から消失 | `outputs/phase-11/sentry-secret-list-redacted.md`（rollback 節）または専用 evidence file | Phase 6 escalate 時のみ実本番値で実行、それ以外は dummy で代替 |
| T-07 | matrix dedupe dry-run | `sync_jobs.failed` dedupe window 確認 | staging fake event を `apps/api` ローカル test 経路で 2 回連続発火（実 cron 起動はしない） | 1 回目通知、2 回目は 30min dedupe 内で抑制 | `outputs/phase-11/slack-test-notification-evidence.md`（dedupe 節） | G-02 通過後・任意（最小 1 系統で十分） |

## staging-only / production-deferred の境界

| 項目 | staging | production |
| --- | --- | --- |
| T-01 / T-02 Sentry | 本タスクで実行 | G-03 通過後・Phase 11 後段 |
| T-03 / T-04 Slack | 本タスクで実行 | G-03 通過後・Phase 11 後段 |
| T-05 redaction grep | 本タスクで実行（commit 候補前 mandatory） | 同左（production 用 evidence ファイルにも適用） |
| T-06 rollback | dummy 値で staging のみ | 異常時のみ実本番で実行（Phase 6 トリガ） |
| T-07 dedupe dry-run | staging のみ（最小 1 系統） | 不要（production への dry-run 持ち込みは禁止） |

## 実行順序図

```
G-01 設計確定
  │
  ▼
T-01 (Sentry pre-state)  T-03 (Slack pre-state)   ← 並列可
  │                         │
  └────────── G-02 ─────────┘  approval: 1Password 参照確認
                │
                ▼
T-02 (Sentry smoke)  T-04 (Slack smoke)            ← 並列可
                │                │
                └─── T-05 grep ──┘                  ← T-02/T-04 直後 mandatory
                       │
                       ▼
                    T-07 dedupe（任意・staging）
                       │
                       ▼
              G-03 production approval
                       │
                       ▼
        production 側で T-01〜T-05 を再実行（Phase 11 後段）
```

## redact ルール

- Sentry DSN URL（`https://<key>@<host>/<project>`）は **すべての evidence で `***` mask**。event id（短縮 hex）と timestamp のみ記録
- Slack webhook URL（`https://hooks.slack.com/services/...`）は **永久に redact**。permalink（`https://<workspace>.slack.com/archives/...`）は workspace 識別子部分を `***` mask して記録可
- `secret list` 出力は値非表示形式のみ保存。`--with-values` 等のフラグは使用禁止

## coverage 確認（self-check）

| AC | 対応 Test ID |
| --- | --- |
| AC-01 Sentry staging test event 受信証跡 | T-01 / T-02 |
| AC-02 Slack staging test alert 送信証跡 | T-03 / T-04 / T-07 |
| AC-03 secret 実値が repo / evidence / log / PR body に残らない | T-05（+ T-01 / T-03 の値非表示形式 list） |
| AC-04 失敗時 fallback / 保留判断が runbook 化 | T-06（rollback 経路の動作確認） |
| AC-05 09b runbook placeholder 更新 | Phase 12 で別途確認（Test ID 不要） |

5 AC のうち AC-01〜AC-04 を Test ID で網羅。AC-05 は Phase 12 ドキュメント差分でカバー。

## notes

実 evidence は Phase 11 で取得する spec として本ファイルに固定。Phase 5 はこの Test ID を runbook step に展開する。
