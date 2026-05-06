# Phase 9: 品質保証 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: docs-only タスクのため、品質保証は「仕様書として後続実行（Phase 11）で破綻しない構造検証 + grep gate + redact gate + ドキュメント整合」に閉じ、コードの型 / lint / test 実行は対象外。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 9 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / NON_VISUAL / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

本仕様書（Phase 1-8 + Phase 11-13 scaffold）が後続実行で破綻しない品質を保証する。docs-only タスクの品質保証は次の 4 軸で行う:

1. **構造検証**: artifacts.json / index.md / 各 phase ファイルの整合
2. **grep gate**: secret 実値（DSN / webhook URL / Slack token）が docs 内に書かれていない
3. **redact gate**: evidence template が値非表示形式で書かれている
4. **ドキュメント整合**: aiworkflow-requirements references と矛盾しない

## 入力

- Phase 4-8 全成果物（Phase 4-7 は並列タスクが生成、Phase 8 は本タスクで生成済）
- `outputs/phase-01/main.md` 〜 `outputs/phase-08/main.md`
- `phase-01.md` 〜 `phase-13.md`
- `artifacts.json` / `index.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 検証観点

| Q-ID | 観点 | 検証方法 |
| --- | --- | --- |
| Q-01 | `artifacts.json` の phases 配列と `index.md` 列挙が一致 | 目視 + diff |
| Q-02 | 全 phase-NN.md / outputs/phase-NN/main.md がファイル存在（NN: 01-13） | `ls` で 26 件確認 |
| Q-03 | secret 実値が一切書かれていない（self-grep） | `rg -n` で DSN / webhook / xoxb / xoxp パターン 0 件 |
| Q-04 | AC matrix（Phase 7）と各 phase 成果物の trace が完備 | Phase 7 出力の AC ↔ evidence path ↔ phase の対応表を再確認 |
| Q-05 | 不変条件 #14 / #16 / #17 が各 phase で扱われている | Phase 1（マッピング表）/ Phase 2（前提）/ Phase 5（runbook）/ Phase 6（異常系）/ Phase 11（evidence）で言及確認 |
| Q-06 | approval gate / 自走禁止操作の網羅性（Phase 1 リスト × 各 phase 言及） | Phase 1 の G-01〜G-05 と自走禁止 6 項目が後続 phase で参照されている |
| Q-07 | forward 課題（R-04 = `SLACK_ALERT_WEBHOOK_URL` 命名整合）が Phase 5 冒頭で対応条件化 | Phase 5 の先頭 subtask に「`SLACK_ALERT_WEBHOOK_URL` の取扱い確定」が明記 |
| Q-08 | aiworkflow-requirements との整合（observability-monitoring.md / deployment-secrets-management.md） | Phase 8 の D-01〜D-06 判定が PASS / NEW-SSOT / FORWARD のみ |

## 検証コマンド（コピペで再現可能）

```bash
# Q-02: ファイル存在検証
ls docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/phase-{01,02,03,04,05,06,07,08,09,10,11,12,13}.md
ls docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-{01,02,03,04,05,06,07,08,09,10,11,12,13}/main.md

# Q-03: secret 実値 grep gate（0 件であること）
rg -n 'SENTRY_DSN assignment containing an https DSN|sentry\.io/[0-9]+/[0-9]+' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/
rg -n 'hooks\.slack\.com/services/[A-Z0-9]|SLACK_.*=.*https://' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/
rg -n 'xox[bp]-[A-Za-z0-9-]+' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/

# Q-01: artifacts.json と index.md の phase 列挙
jq '.phases[].phase' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json
rg -n 'phase-[0-9]+' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/index.md

# Q-05: 不変条件言及
rg -n '#14|#16|#17|INV ' docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/
```

## 失敗時の戻り先

| 失敗観点 | 戻り先 phase | 対応 |
| --- | --- | --- |
| Q-01 / Q-02 | Phase 0（scaffold 補修） | artifacts.json と実ファイルの差分を埋める |
| Q-03（grep で実値検出） | 該当 phase へ即時戻り | redact 修正後 commit せずに再検査 |
| Q-04 | Phase 7 戻し | AC matrix を更新 |
| Q-05 | 該当 phase 戻し | INV 言及を追補 |
| Q-06 | Phase 1 / 該当 phase 戻し | gate / 自走禁止項目の整合再確認 |
| Q-07 | Phase 5（並列タスク完了後に確認） | 先頭 subtask 追加 |
| Q-08 | Phase 8 戻し | DRY 化判定を再確定 |

## サブタスク管理

- [ ] Q-01〜Q-08 の検証を実施
- [ ] 検証コマンドの実行結果を `outputs/phase-09/main.md` に判定表として記録
- [ ] FAIL / DEFER がある場合は戻り先 phase を明記
- [ ] 全 PASS の場合は Phase 10 最終レビューへ進む宣言

## 成果物

- `outputs/phase-09/main.md`（Q-01〜Q-08 判定表 / 検証コマンド一式 / 全 PASS 宣言または FAIL 一覧）


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

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- Q-01〜Q-08 すべてに判定（PASS / FAIL / DEFER）が記録されている
- FAIL がある場合、戻り先 phase が明記されている
- secret 実値の grep が 0 件であることが確認されている
- Phase 10 最終レビューへ進む条件が満たされている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、品質保証判定（Q-01〜Q-08）と検証コマンド再現セットを引き渡す。
