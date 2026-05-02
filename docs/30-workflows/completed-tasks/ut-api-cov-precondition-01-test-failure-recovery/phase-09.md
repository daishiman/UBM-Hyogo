# Phase 9: 品質保証 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 9 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装後に必要な lint / typecheck / regression run / coverage guard の品質 gate を仕様化する。

## 実行タスク

1. 実装後に実行する `pnpm typecheck` / lint / focused test / regression run を列挙する。
2. 既存 test に regression なきことを確認する evidence path を固定する。
3. `bash scripts/coverage-guard.sh` が exit 0 を返すことを Phase 11 evidence に接続する。

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
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md


- [ ] 品質 gate コマンドと evidence path が `outputs/phase-09/main.md` に記録されている
- [ ] apps/api 80% precondition gate と UT-08A-01 85% upgrade gate が分離され、同じ coverage 値を二重に PASS 化していない
- [ ] 実装、deploy、commit、push、PR を実行していない
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、AC、blocker、evidence path、approval gate を渡す。
