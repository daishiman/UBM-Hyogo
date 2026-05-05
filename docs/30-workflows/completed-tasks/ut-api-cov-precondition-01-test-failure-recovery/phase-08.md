# Phase 8: DRY 化 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 8 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

重複 test fixture / helper の DRY 化候補と命名統一方針を仕様化する。

## 実行タスク

1. F01-F13 の修復時に重複し得る test fixture / helper を抽出する。
2. `_shared/` への昇格候補と、昇格しない局所 helper の判断基準を識別する。
3. 命名・配置の規約と差分を outputs/phase-08/main.md に残す。

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
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`


- [ ] DRY 化候補と採用しない候補の判断基準が `outputs/phase-08/main.md` に記録されている
- [ ] coverage AC は未実測のまま Phase 9 / Phase 11 へ渡され、Phase 8 で PASS 宣言されていない
- [ ] 実装、deploy、commit、push、PR を実行していない
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、AC、blocker、evidence path、approval gate を渡す。
