# Phase 11: 手動 smoke / 実測 evidence — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装後の手動 smoke と coverage 実測。NON_VISUAL の場合は evidence ファイルで代替する。
この Phase は画面 screenshot を要求せず、コマンド出力・coverage summary・手動確認ログを NON_VISUAL evidence として保存する。

## 実行タスク

1. coverage 実測（apps/api or apps/web）を実行し coverage-result.md に記録する。
2. regression-check.md に既存 test 影響なきことを記録する。
3. NON_VISUAL の場合は manual-evidence.md に手動確認結果を記録する。

## 参照資料

- 起票根拠: 2026-05-01 実測ログ（Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-api-cov-precondition-01-test-failure-recovery/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: depends_on を参照
- 下流: blocks を参照

## 多角的チェック観点

- #1 responseEmail system field
- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/coverage-result.md
- outputs/phase-11/regression-check.md
- outputs/phase-11/manual-evidence.md

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`

## NON_VISUAL evidence 要件

- `outputs/phase-11/coverage-result.md`: coverage 実測コマンド、exit code、summary JSON path、閾値判定を記録する。
- `outputs/phase-11/regression-check.md`: 既存 510 件 PASS test に対する regression 確認結果を記録する。
- `outputs/phase-11/manual-evidence.md`: manual smoke の観点、確認手順、未実測項目、blocker を記録する。
- 未実測の項目は `PASS` と書かず、`blocked` または `pending` と明記する。

- [ ] Phase 11 NON_VISUAL evidence 3 files（coverage-result.md / regression-check.md / manual-evidence.md）の記録項目が揃っている
- [ ] 実測実行前のため各 evidence は `pending` または `NOT_EXECUTED` として記録され、PASS と誤認されない
- [ ] Phase 11 の AC として、全 13 test green、`bash scripts/coverage-guard.sh --no-run --package apps/api` exit 0、apps/api 80% precondition gate、既存 510 件 regression なしが保持され、85% upgrade gate は UT-08A-01 に委譲されている
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、AC、blocker、evidence path、approval gate を渡す。
