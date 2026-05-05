# outputs phase 05: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: 実装順序と rollback point を runbook 化する
- measurement_status: 未実測。runbook 作成は修復完了ではない

## implementation order

1. F13 auth route hookTimeout
2. F08-F12 auth/session route 401/403 boundary
3. F07 admin notes repository query
4. F05-F06 workflow alias / tag queue status
5. F01-F04 sync forms response identity / fixture drift
6. all focused tests -> `pnpm --filter @repo/api test:coverage` -> `bash scripts/coverage-guard.sh`

## repair classification

- `fixture drift`
- `production regression`
- `stale spec`

## handoff

Phase 6 へ、実装順序、各 step の exit gate、修復分類、root cause 記録フォーマットを渡す。
