# Phase 5: 実装ランブック — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 5 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

実装担当者が F01-F13 を最小差分で回復し、coverage guard まで到達するための順序と rollback point を定義する。

## 参照資料

- phase-02.md
- phase-04.md
- outputs/phase-04/main.md
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## 実装順序

| step | failure IDs | 理由 | exit gate |
| --- | --- | --- | --- |
| 1 | F13 | hookTimeout は他 test run を不安定化させるため先に解消する | auth routes focused test が timeout しない |
| 2 | F08-F12 | auth/session helper drift は複数 route に波及する | 401/403 契約が focused tests で green |
| 3 | F07 | repository seed / query drift を route 修復前に安定化する | adminNotes focused test green |
| 4 | F05-F06 | workflow enum / alias drift を isolated に直す | workflow focused tests green |
| 5 | F01-F04 | form sync は fixture と identity 境界が多いため最後にまとめる | sync-forms focused test green |
| 6 | all | package coverage / guard を実測する | Phase 11 evidence へ記録 |

## 修復ルール

- まず failing assertion と現行仕様の差分を特定する。
- test fixture drift の場合は fixture / helper を修正し、production behavior を不用意に変えない。
- production regression の場合は最小修正と focused test を同じ step で確認する。
- 仕様の方が stale の場合は Phase 12 で正本更新または未タスク化する。
- timeout は cleanup / unresolved async resource を直し、単純な timeout 延長を最終解にしない。

## 禁止事項

- failing test の `skip` / `todo` 化。
- coverage threshold 緩和。
- unrelated refactor。
- apps/web から D1 への直接アクセス追加。
- Phase 13 user approval 前の commit / push / PR。

## 実行タスク

1. 上表の実装順序を採用する。
2. 各 step の focused test command と rollback point を実装ログに残す。
3. 修復分類を `fixture drift` / `production regression` / `stale spec` のいずれかで記録する。
4. Phase 6 に root cause summary を引き渡す。

## 成果物

- Phase 5: `outputs/phase-05/main.md`

## 依存成果物参照

- Phase 4: `outputs/phase-04/main.md`

## 統合テスト連携

実装順序ごとの focused test を Phase 11 の package-wide test に接続する。fixture drift 修復後は `sync-forms-responses.test.ts` の F01-F04 と、先行修復済み F05-F13 の regression なしをまとめて確認する。

## 完了条件

- [ ] F01-F13 の実装順序と exit gate が明確である。
- [ ] coverage guard 前に focused test を使う順序が明確である。
- [ ] この Phase 自体では実装・実測を完了扱いにしていない。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 6 へ、実装順序、修復分類、focused test exit gate、root cause 記録フォーマットを渡す。
