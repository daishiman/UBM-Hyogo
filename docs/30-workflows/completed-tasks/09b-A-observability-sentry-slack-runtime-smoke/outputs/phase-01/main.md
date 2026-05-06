# Output Phase 1: 要件定義（確定）

## status

SPEC_CONFIRMED / NOT_EXECUTED

## taskType / 実装区分

docs-only（runbook formalization）。実 secret 登録・deploy・smoke は Phase 5 / Phase 11 で実行。

## 確定 AC（Acceptance Criteria）

| # | AC | 詳細条件 | observable evidence |
| --- | --- | --- | --- |
| AC-01 | Sentry staging test event の受信が証跡化される | staging project に意図 test event を 1 件以上送信し、Sentry 上で event id を取得する。値非公開で id のみ記録 | `outputs/phase-11/sentry-test-event-id.md` |
| AC-02 | Slack staging test alert の送信が証跡化される | staging webhook/workflow に test notification を 1 回送信し、Slack 上の delivered timestamp と message permalink（実 URL は redact）を記録 | `outputs/phase-11/slack-test-notification-evidence.md` |
| AC-03 | secret 実値が repo / evidence / log / PR body に残らない | grep gate `rg -n 'SENTRY_DSN assignment containing an https DSN\|hooks\.slack\.com/services\|sentry\.io/[0-9]+' .` が 0 件、`scripts/cf.sh secret list` 出力は値非表示形式のみ保存 | `outputs/phase-11/redaction-grep-result.md`、`outputs/phase-11/sentry-secret-list-redacted.md`、`outputs/phase-11/slack-secret-list-redacted.md` |
| AC-04 | 失敗時 fallback / 保留判断が runbook 化される | Sentry 受信失敗・Slack 送信失敗・rotation 必要時の fallback 判定 tree が `incident-response-runbook.md` または同等 docs に記述される | Phase 5 で配置する runbook 文言 |
| AC-05 | 09b release-runbook / incident-response-runbook の placeholder が更新され、09c の observability blocker が解除可能になる | placeholder「未登録」表記が「実 secret 登録済・値は 1Password 正本」に更新され、09c blocker reference が closed 候補としてマーク | Phase 12 ドキュメント差分 + 09c index 更新 PR 候補 |

## 不変条件マッピング

| 不変条件 | 紐づく AC / gate | 適用形 |
| --- | --- | --- |
| INV #14 Cloudflare free-tier | AC-01 / AC-02 | Sentry / Slack 共に free / 既存 plan 範囲のみ。paid plan を要する条件は採用しない |
| INV #16 secret values never documented | AC-03 全体 / approval gate G-02 | op:// 参照のみ。実値は repo / evidence / log / PR body / chat にも転記しない。投入は `op read \| bash scripts/cf.sh secret put` の stdin |
| INV #17 incident response readiness | AC-01 / AC-02 / AC-04 | Sentry 受信導線 + Slack 通知導線 + fallback judgement tree が runbook に揃う |

## 自走禁止操作リスト

以下は Claude Code が自走で実行してはならない。Phase 5 / Phase 11 で **明示的な user approval 取得後** に実行する:

- [ ] 実 Sentry DSN を Cloudflare staging / production に `scripts/cf.sh secret put` で登録すること
- [ ] 実 Slack webhook URL / workflow secret を Cloudflare staging / production に登録すること
- [ ] `bash scripts/cf.sh deploy ... --env staging|production` の deploy 実行
- [ ] Sentry / Slack project 側の有償 plan アップグレード
- [ ] 本タスク内での `git commit` / `git push` / `gh pr create`
- [ ] 1Password 正本の項目削除 / rotation（rotation runbook が承認されるまで）

## approval gate 一覧

| gate id | 内容 | 必要な user approval |
| --- | --- | --- |
| G-01 | Phase 2 設計（1Password item 構造 / secret 命名表）の確定 | 設計 review 完了 |
| G-02 | 実 secret 登録（staging）の実行許可 | DSN / webhook URL の op:// 参照が 1Password に揃ったことの確認 |
| G-03 | 実 secret 登録（production）の実行許可 | staging smoke PASS の evidence 確認 |
| G-04 | 09b runbook placeholder 文言更新の commit | Phase 12 内容レビュー完了 |
| G-05 | PR 作成 | Phase 13 内容と CI 通過の確認 |

## evidence path（後続 phase 参照用）

| 用途 | path |
| --- | --- |
| Sentry secret list（値非表示） | `outputs/phase-11/sentry-secret-list-redacted.md` |
| Sentry test event id | `outputs/phase-11/sentry-test-event-id.md` |
| Slack secret list（値非表示） | `outputs/phase-11/slack-secret-list-redacted.md` |
| Slack test notification evidence | `outputs/phase-11/slack-test-notification-evidence.md` |
| 漏洩検査 grep 結果 | `outputs/phase-11/redaction-grep-result.md` |
| runbook 差分（placeholder 更新） | `outputs/phase-12/runbook-diff.md` |

## 用語集

| 用語 | 定義（本タスク内）|
| --- | --- |
| Sentry DSN | Sentry project に event を送信する認証付き endpoint URL。`https://<key>@<host>/<project>` 形式で、**値は 1Password 正本のみで保持** |
| Slack webhook | Slack Incoming Webhook URL。`https://hooks.slack.com/services/...` 形式。`SLACK_WEBHOOK_*` secret 名で配置 |
| Slack workflow | Slack Workflow Builder のトリガー URL。incoming webhook の代替として severity 別チャンネル分岐などに使用可能 |
| dedupe window | 同一 alert を抑制する時間窓。例: 30min 内の同一 fingerprint は 1 回のみ通知 |
| severity gate | P1 / P2 等の重大度判定条件。本タスクは P1（Workers 5xx rate / availability impact）と P2（sync_jobs.failed 連続・stale running）を staging smoke 範囲とする |
| redaction | secret 実値を出力・evidence から除去する操作。`***` mask、URL の `<key>` 部だけ伏字化など |

## notes

このファイルは Phase 1 で確定した要件であり、実 secret 登録・smoke 実行結果は含まない。Phase 5（実装ランブック）と Phase 11（実測 evidence）が実行責任を負う。
