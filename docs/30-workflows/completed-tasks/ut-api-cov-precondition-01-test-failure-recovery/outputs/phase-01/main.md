# outputs phase 01: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- taskType: implementation
- workflow_state: implemented-local
- visualEvidence: NON_VISUAL
- purpose: 13 failing tests と coverage AC を後続 phase の入力として固定する
- measurement_status: 未実測。test green / coverage threshold / guard exit 0 は PASS 扱いしない

## 固定した入力

- baseline: 2026-05-01 実測ログ（Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)）
- failure IDs: F01-F13
- coverage AC: all 13 tests green、`bash scripts/coverage-guard.sh --no-run --package apps/api` exit 0、`apps/api/coverage/coverage-summary.json` 生成、apps/api Statements/Branches/Functions/Lines >=80%、510 passed tests no regression。85% upgrade gate は UT-08A-01 に委譲
- 禁止操作: application code edit、deploy、commit、push、PR

## handoff

Phase 2 へ F01-F13 inventory、coverage AC、test-fixture implementation / NON_VISUAL / implemented-local 境界、未実測を PASS にしないルールを渡す。
