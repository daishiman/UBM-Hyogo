# Phase 10: 最終レビュー — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: docs-only タスクのため、最終レビューは「実 secret 登録 / smoke 実行（Phase 11）着手前の Go/No-Go 判定」に閉じ、実コード変更レビューは対象外。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 10 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / NON_VISUAL / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11（手動 smoke / 実測 evidence）着手前の **Go/No-Go 判定**を行う。本タスクは docs-only のため、Go 判定後も Phase 11 では「approval gate 通過 → 実 secret 登録 → smoke 1 回実行 → evidence 記録」までを **明示的な user approval を都度取得して** 進める前提を再確認する。

## 入力

- Phase 1-9 全成果物
  - Phase 1: 確定 AC（5 件）/ 不変条件マッピング / 自走禁止操作 / approval gate
  - Phase 2: 1Password item / Cloudflare secret 命名 / 通知 matrix / rollback / fallback tree
  - Phase 3: 設計レビュー判定（R-01〜R-06、R-04 が forward 課題）
  - Phase 4: テスト戦略（並列タスク成果）
  - Phase 5: 実装ランブック（並列タスク成果）
  - Phase 6: 異常系検証（並列タスク成果）
  - Phase 7: AC マトリクス（並列タスク成果）
  - Phase 8: DRY 化結果（D-01〜D-06）
  - Phase 9: 品質保証（Q-01〜Q-08）

## レビュー観点

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| R-01 | Phase 1-3 設計が Phase 5 runbook で実行可能な粒度に降りているか | 1Password item 名 / op:// 参照 / cf.sh コマンド / smoke 手順がコピペ実行可能粒度 |
| R-02 | 異常系（Phase 6）の recovery が approval gate を含めて完備 | secret rollback / DSN rotation / Slack webhook revoke / fallback tree の各分岐に approval 要否が明記 |
| R-03 | AC matrix（Phase 7）が evidence path 1:1 で漏れなし | AC-01〜AC-05 と evidence path 6 系統が 1:1 対応 |
| R-04 | DRY（Phase 8）と aiworkflow-requirements の整合 | D-01〜D-06 が PASS / NEW-SSOT / FORWARD のみで blocker なし |
| R-05 | 品質保証（Phase 9）が全 PASS（DEFER は Phase 10 で吸収） | Q-01〜Q-08 で FAIL なし、DEFER は本 Phase で解消 |
| R-06 | Phase 11 / Phase 12 / Phase 13 の予約事項が明確 | Phase 11 evidence path 6 系統 / Phase 12 placeholder 更新対象 / Phase 13 PR 本文構成 が scaffold で確認可能 |
| R-07 | 自走禁止 / approval gate の運用が後続実行者にとって自明 | Phase 1 の自走禁止 6 項目 / G-01〜G-05 が後続 phase の冒頭で再掲・参照されている |

## Go/No-Go 判定基準

| 結果 | 条件 |
| --- | --- |
| **Go** | R-01〜R-07 がすべて PASS、または FIX-NEEDED が軽微で Phase 11 着手の blocker でない |
| **No-Go**（戻し） | R-01〜R-07 のいずれかが FIX-NEEDED かつ Phase 11 実 smoke の前提を欠く（例: secret 命名未確定 / evidence path 不在 / approval gate 不備） |
| **DEFER** | 並列タスク成果未到達のため判定保留。並列完了後に再判定 |

## サブタスク管理

- [ ] Phase 4-7 並列タスクの成果取り込み
- [ ] R-01〜R-07 の判定実施
- [ ] Phase 9 の DEFER が 0 件であることの確認
- [ ] Go/No-Go 結論を `outputs/phase-10/main.md` に記録
- [ ] Phase 11 着手条件と forward 課題リストを記録

## 成果物

- `outputs/phase-10/main.md`（R-01〜R-07 判定 / Go/No-Go 結論 / Phase 11 着手条件 / forward 課題リスト）


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

- R-01〜R-07 すべてに判定が記録されている
- Go / No-Go / DEFER のいずれかが結論として明示
- Go の場合: Phase 11 着手条件（approval gate G-02 取得 / 1Password item 揃い）が明示
- No-Go の場合: 戻り先 phase と修正項目が明示

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、Go/No-Go 判定 / 着手条件 / forward 課題リストを引き渡す。Go の場合のみ Phase 11 の自走禁止解除条件（approval gate G-02 取得）に進む。
