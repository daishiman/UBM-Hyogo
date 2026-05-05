# outputs phase 07: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: Phase 1-6 を AC matrix として統合し、Phase 8-12 の判定軸を固定する
- measurement_status: AC-1 から AC-8 は pending / 未実測。placeholder や TBD は PASS に昇格しない

## AC matrix summary

| AC | required evidence | current status |
| --- | --- | --- |
| AC-1 F01-F13 all green | `outputs/phase-11/regression-check.md` | pending / 未実測 |
| AC-2 apps/api coverage succeeds | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-3 coverage guard succeeds | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-4 apps/api Stmts/Branches/Funcs/Lines >=80% precondition gate | `outputs/phase-11/coverage-result.md` | pending / 未実測 |
| AC-5 85% upgrade gate | UT-08A-01 | delegated / 本タスク PASS 条件外 |
| AC-6 510 passed tests no regression | `outputs/phase-11/regression-check.md` | pending / 未実測 |
| AC-7 root cause summary | `outputs/phase-06/main.md` | specification prepared / 実測ではない |
| AC-8 test-fixture implementation NON_VISUAL close-out | Phase 11/12 docs evidence | pending |

## promotion rule

`pending` から `pass` へ昇格できるのは、実コマンドの exit code、生成 artifact、coverage values、regression check が記録された場合だけ。未実行、未計測、placeholder、TBD は PASS 不可。

## handoff

Phase 8 へ、AC matrix、昇格条件、NON_VISUAL evidence path、test-fixture implementation close-out 境界を渡す。
