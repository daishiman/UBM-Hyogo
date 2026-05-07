# Phase 4: テスト戦略 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ]

CONST_004 例外根拠: 本タスクは Phase 1 で `taskType=docs-only` / `NON_VISUAL` / `spec_created` / `remaining-only` を確定済み。アプリケーションコード変更・deploy・commit・push・PR は本仕様書作成では行わない。テスト戦略は **代替 evidence の網羅性検証**（実 secret 登録手順・smoke 手順・redact 手順が evidence として再現可能か）に置き換える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 4 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

実 secret 登録手順・smoke 手順・redact 手順それぞれが evidence として再現可能か検証する戦略を確定する。Phase 5 runbook と Phase 11 実測 evidence の橋渡しを Test ID 単位で固定する。

## 入力

- Phase 1 確定 AC（AC-01〜AC-05）と evidence path 6 系統
- Phase 2 secret 命名表（`SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL`）
- Phase 2 通知 matrix（5 trigger / dedupe window / suppress 条件）
- Phase 2 rollback / rotation 手順（6.1 / 6.2 / 6.3）
- Phase 3 forward 課題（R-04: `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` 整合）

## テスト分類

| 分類 | 目的 | 実行 phase |
| --- | --- | --- |
| 手順 dry-run テスト | 実 secret 登録前に `bash scripts/cf.sh secret list --config <wrangler.toml> --env <env>` を実行し、空 list を baseline として記録する。secret put 前後の差分が evidence になることを確認 | Phase 11（pre-state） |
| redaction grep テスト | `rg -n 'SENTRY_DSN assignment containing an https DSN\|sentry\.io/[0-9]+/[0-9]+'` / `rg -n 'hooks\.slack\.com\|SLACK_.*=.*https://'` / `rg -n 'xox[bp]-'` の 3 系統を repo 全体に対し実行し、0 件であることを記録 | Phase 11 |
| smoke 受信テスト | Sentry test event id 確認（dashboard で event id を copy し redact 後に記録）/ Slack test notification 受信確認（permalink を redact 後に記録、または screenshot） | Phase 11 |
| rollback 手順テスト | secret put → secret list（存在確認）→ secret delete → secret list（不在確認）の往復を staging で 1 周実行 | Phase 11 |
| 通知 matrix dry-run | dedupe window / suppress 条件は staging fake event で確認。実発火させずに分岐記述の網羅性を確認する場合は table-only verification | Phase 5 / Phase 11 |

## 通知 matrix の閾値テスト方針

- AC-02 では最小 1 件（手動 test webhook 送信）で PASS。5 trigger を全件発火させない。
- dedupe / suppress 条件は staging fake event を 2 回連続で発火し 2 回目が抑制されることを 1 系統だけ確認（`sync_jobs.failed` 連続 3 回シナリオを 30min 圧縮せず record-only で代替可）。
- production への通知 matrix 検証は G-03 通過後に Phase 11 後段で実施。本タスク内では実行しない。

## 失敗時の rerun ルール

- 受信失敗時は Phase 2「7. 失敗時 fallback 判定 tree」を辿り、原因切り分け後に同じ Test ID を再実行
- 5 分以内に再現しない場合は次の Test ID に進まず Phase 6 異常系へ escalate
- redaction grep が hit した場合は即時 Phase 6 A-04 escalation。test 続行禁止
- 同一 Test ID の rerun は最大 2 回まで。3 回連続で失敗する場合は Phase 6 escalation 経由で人間判断
- rerun 間は dedupe window を考慮し、Slack test は最低 1 分以上の間隔を空ける（alert fatigue 防止）
- 各 rerun は evidence file に「rerun #n / timestamp / 原因仮説」を記録する


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

- `outputs/phase-04/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- Test ID 表（T-01〜T-07）が `outputs/phase-04/main.md` に確定
- 各 Test ID に evidence path / 実コマンド / PASS 条件 / approval gate が 1:1 対応
- staging-only / production-deferred の境界が明記
- Phase 5 runbook がこの Test ID 表を実行順序として読み取れる粒度で確定

## タスク100%実行確認

- [ ] AC-01〜AC-05 すべてに対応する Test ID が存在する
- [ ] 実値が evidence に残らないことが redaction grep テストで確認できる
- [ ] approval gate G-01〜G-05 と Test ID の対応が示されている
- [ ] 実装・deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、Test ID 表・実行順序・rerun ルールを渡す。Phase 5 はこの Test ID を runbook step に展開する。
