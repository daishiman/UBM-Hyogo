# outputs phase 04: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: F01-F13 と coverage AC を command / evidence path に接続する
- measurement_status: 未実測。command 記載だけでは PASS ではない

## command strategy

- focused: `pnpm --filter @repo/api test:run -- <target test file>`
- package coverage: `pnpm --filter @repo/api test:coverage`
- repository guard: `bash scripts/coverage-guard.sh`

## evidence path

- AC-1 / AC-5: `outputs/phase-11/regression-check.md`
- AC-2 / AC-3 / AC-4: `outputs/phase-11/coverage-result.md`
- NON_VISUAL 補助 evidence: `outputs/phase-11/manual-evidence.md`
- root cause: `outputs/phase-06/main.md`

## handoff

Phase 5 へ、focused test から coverage guard までの実行階層、coverage thresholds、evidence path を渡す。
