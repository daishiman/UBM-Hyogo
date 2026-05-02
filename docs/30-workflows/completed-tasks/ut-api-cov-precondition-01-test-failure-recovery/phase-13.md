# Phase 13: PR 作成 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 13 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

user approval を得た上で PR を作成する。

## 実行タスク

1. user approval を取得する。approval なしで commit / push / PR 作成 / CI 待機を開始しない。
2. PR を作成する（base=dev または main をタスク特性で決定）。
3. CI 全 green を確認する。

## user approval gate

- gate status: required
- gate owner: user
- blocked operations before approval: commit, push, PR 作成, CI 実行待機を伴う remote operation
- approval evidence path: outputs/phase-13/main.md
- approval が未取得の場合、この Phase の status は `blocked` とし、PR 作成を実行しない。

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
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`
- Phase 12: `outputs/phase-12/main.md`


- [ ] user approval gate が `outputs/phase-13/main.md` に記録されている
- [ ] approval 未取得の場合は status `blocked` とし、commit / push / PR 作成を実行していない
- [ ] approval 後に実行する PR 作成手順と CI 確認手順が明記されている
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

最終 Phase のため次 Phase への引き渡しはない。未完了 blocker がある場合は follow-up task として起票する。
