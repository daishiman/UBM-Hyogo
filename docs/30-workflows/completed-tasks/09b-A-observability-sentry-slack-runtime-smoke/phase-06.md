# Phase 6: 異常系検証 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ]

CONST_004 例外根拠: 本タスクは docs-only / spec_created / remaining-only。本 phase は **runbook 失敗パターンと escalation 経路の spec 化** であり、実 secret 登録・smoke・rollback の実行は Phase 11 で user approval 取得後に行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 6 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5 runbook の失敗パターン・部分失敗時の安全な戻り方を仕様化する。Sentry / Slack / secret 配置 / redaction の各失敗を A-ID で固定し、検知・即時対応・rollback・再 smoke 条件を 1:1:1:1 で対応させる。

## 入力

- Phase 5 runbook（Step 0〜7）
- Phase 2 「7. 失敗時 fallback 判定 tree」と「6.1〜6.3 rollback / rotation」
- Phase 1 確定 AC（特に AC-03 secret 漏洩防止 / AC-04 fallback runbook 化）

## 検証する異常系

| A-ID | 概要 | trigger 条件 |
| --- | --- | --- |
| A-01 | Sentry test event が受信されない | DSN typo / project 違い / project rate limit / 受信遅延 60s 超 |
| A-02 | Slack test notification が届かない | webhook 失効 / channel 削除 / token rotated / 401 / invalid_payload / rate_limited |
| A-03 | secret put 失敗 | 権限不足 / op:// 参照解決失敗 / wrangler binding 不整合 / API token 失効 |
| A-04 | redaction grep が hit する | DSN / webhook の値が docs / log / PR body / evidence に混入 |
| A-05 | 既存 runbook と整合しない placeholder 残存 | Step 7 の placeholder 文言更新が漏れている / 旧 secret 名が残る |
| A-06 | production secret に staging 値が混入 | Step 6 で env を間違える / op:// 参照を staging 側のまま使う |

## 各異常系の detection / recovery / rollback 設計

| A-ID | detection | recovery | rollback / 再 smoke 条件 |
| --- | --- | --- | --- |
| A-01 | Step 3 で Sentry Issues に event が現れない | DSN を 1Password と照合・project / env を再確認・5min 待機後再送 | secret rollback（Phase 2 §6.1）→ 再 put → Step 3 再実行。改善せず status page 異常時は manual log 確認継続（INV #17 維持） |
| A-02 | Step 4 で Slack message 不着 / 4xx 応答 | webhook 状態を Slack 管理画面で確認・必要なら revoke + 新規発行（Phase 2 §6.3） | webhook revoke → 新 webhook を 1Password 更新 → secret rollback → 再 put → Step 4 再実行 |
| A-03 | `cf.sh secret put` が non-zero exit / `secret list` に名前が出ない | API token 認証 / op CLI 認証 / vault 権限 / wrangler.toml の env 設定を順に切り分け | 認証修復後に再 put。複数 secret で再発する場合は Step 1 に戻り 1Password item 構成を再検証 |
| A-04 | T-05 の 3 系統 grep のいずれかが hit | **即時**: 該当 file の該当行を redact、git に未 commit なら `git restore`、commit 済みなら新 commit で削除（履歴削除は user approval 必須）/ DSN や webhook が漏れた場合は対応する rotation / revoke を即時実行 | rotation / revoke 完了後にのみ Step 5 を再実行。grep 0 件確認まで Step 6 進行禁止 |
| A-05 | Step 7 後に `rg -n '未登録\|TBD\|placeholder' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` に hit | 該当箇所を Step 7 文言に再更新 | 再更新後、再 grep が 0 件になることで PASS |
| A-06 | production の `secret list` に staging の DSN 値が紐づく可能性発覚（受信先 project が staging） | **即時**: production 側 secret を delete → production 1Password 参照で再 put → Sentry / Slack 双方で受信先確認 | rollback 後に Step 6 を最初からやり直し。受信履歴に staging cross-contamination が残る場合は Sentry / Slack 側で該当 event を delete し event id を redact 化 |

## alert fatigue リスク（Slack 誤通知の suppress / dedupe）

- T-04 のテスト送信を **連投しない**（1 回のみ・必要なら間隔 1min 以上）
- T-07 dedupe dry-run は staging のみ・最小 1 系統で実施
- staging の `#ubm-incident` を本番 `#ubm-incident` と分離（Phase 2 通知 matrix の channel 表記が staging / production を分離している前提）。同一チャンネル運用時は test message に明示的 prefix `[STAGING SMOKE]` を付与

## approval gate（重大事故時）

| 事象 | 必要な approval |
| --- | --- |
| A-04 で実値が漏洩確定 | 人間による rotation / revoke 実行承認 + history 削除可否判断 |
| A-06 で production cross-contamination 確定 | 人間による即時 secret delete / project 影響範囲確認承認 |
| Phase 2 §6.2 / §6.3 の rotation / revoke を実行する場合 | 人間による「旧 key disable タイミング」承認（並列稼働期間を最小化） |


## 実行タスク

1. この Phase の入力、出力、approval gate、redaction 境界を確認する。
2. 実 secret 値、DSN URL、Slack webhook URL、token 値が仕様書に含まれていないことを確認する。
3. 後続 Phase または runtime wave へ引き渡す evidence path を明示する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-06/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- A-01〜A-06 すべてに detection / recovery / rollback / 再 smoke 条件が紐づく
- alert fatigue リスクと suppress / dedupe ルールが本 phase 内で再確認されている
- 重大事故時の approval gate が明示されている
- escalation tree が `outputs/phase-06/main.md` に確定する

## タスク100%実行確認

- [ ] A-04（漏洩）の即時対応が「test 続行禁止」になっている
- [ ] A-06（cross-contamination）の即時 secret revoke 経路がある
- [ ] alert fatigue の連投抑止が runbook に紐づく
- [ ] 実装・deploy・commit・push・PR を本タスク内で実行していない

## 次 Phase への引き渡し

Phase 7 へ、AC × 異常系の trace を渡す。AC matrix で「異常系 → 復旧 → 再 smoke」の往復が AC-04 を満たすことを示す。
