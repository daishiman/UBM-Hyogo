# Phase 10: 最終レビュー — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 10 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装前最終レビューとして、AC、scope、不変条件、approval gate、未実測境界の最終確認を仕様化する。

## 実行タスク

1. AC・不変条件・scope・approval gate の最終チェック。
2. blocker 残存の有無を確認する。
3. user approval が必要な操作を再列挙する。

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
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- outputs/phase-10/main.md

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`


- [ ] scope / AC / 不変条件 / approval gate の最終確認結果が `outputs/phase-10/main.md` に記録されている
- [ ] blocker が残る場合は Phase 12 の未タスク検出に引き渡す条件が明記されている
- [ ] 実装、deploy、commit、push、PR を実行していない
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、AC、blocker、evidence path、approval gate を渡す。
