# Phase 7: AC マトリクス — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 7 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-6 の要件、設計、レビュー、test strategy、runbook、root cause を 1 つの AC matrix に統合し、Phase 8 以降の実装整理と Phase 11 evidence が同じ判定軸を使えるようにする。

## 参照資料

- phase-01.md
- phase-04.md
- phase-06.md
- outputs/phase-06/main.md
- .claude/skills/task-specification-creator/references/coverage-standards.md

## AC Matrix

| AC | failure / metric | command or check | required evidence | current status |
| --- | --- | --- | --- | --- |
| AC-1 | F01-F13 all green | focused tests for each target file | `outputs/phase-11/regression-check.md` | pending / 未実測 |
| AC-2 | apps/api coverage run succeeds | `pnpm --filter @repo/api test:coverage` | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-3 | coverage guard succeeds | `bash scripts/coverage-guard.sh` | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-4 | apps/api Statements/Branches/Functions/Lines >=80% precondition gate | coverage summary values | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-5 | 85% upgrade gate | coverage summary values | UT-08A-01 | delegated / 本タスク PASS 条件外 |
| AC-6 | 510 existing pass tests have no regression | package / guard run logs | `outputs/phase-11/regression-check.md` | pending / 未実測 |
| AC-7 | root cause summary exists | F01-F13 root cause table | `outputs/phase-06/main.md` | specification prepared / 実測ではない |
| AC-8 | test-fixture implementation NON_VISUAL close-out boundary is preserved | Phase 11/12 docs evidence | `outputs/phase-11/manual-evidence.md` and Phase 12 strict files | pending |

## 昇格条件

| from | to | 条件 |
| --- | --- | --- |
| pending | blocked | command cannot run, missing dependency, or root cause unresolved |
| pending | pass | command executed, exit code / artifact / coverage values recorded, and no regression found |
| specification prepared | pass | 実装後 evidence が Phase 11 に記録され、Phase 12 が strict docs evidence を閉じる |

未実行、未計測、placeholder、TBD は PASS に昇格できない。

## Phase 8 以降への handoff

- Phase 8: 重複 helper / fixture 整理は AC を壊さない範囲に限定する。
- Phase 9: `test:coverage` と `coverage-guard.sh` の実行結果を品質 gate として扱う。
- Phase 10: AC matrix と evidence path の最終整合をレビューする。
- Phase 11: NON_VISUAL evidence として実測ログ、coverage summary、regression check を記録する。
- Phase 12: test-fixture implementation 境界、strict 7 files、artifacts parity を閉じる。

## 実行タスク

1. AC-1 から AC-8 を Phase 8 以降の共通判定軸として固定する。
2. pending / blocked / pass の昇格条件を明記する。
3. Phase 11 evidence path と Phase 12 test-fixture implementation close-out 境界を接続する。

## 成果物

- Phase 7: `outputs/phase-07/main.md`

## 依存成果物参照

- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`

## 統合テスト連携

AC matrix は Phase 11 の `coverage-result.md`、`regression-check.md`、`manual-smoke-log.md` に対応させる。precondition gate は PASS / upgrade gate は UT-08A-01 委譲として、同じ coverage 値を二重に PASS 判定しない。

## 完了条件

- [ ] AC、failure ID、command、evidence path、current status が 1 表で追跡できる。
- [ ] 未実測が pending として残り、PASS と記載されていない。
- [ ] Phase 8-12 への handoff が具体的である。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 8 へ、AC matrix、昇格条件、NON_VISUAL evidence path、test-fixture implementation close-out 境界を渡す。
