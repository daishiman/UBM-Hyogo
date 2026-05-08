> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書
> 生成 phase: phase-11

# Phase 11 Main: NON_VISUAL Evidence Index

## 判定

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

`apps/web` 実コード変更と PASS 5 点 evidence は取得済み。Sentry dashboard smoke と staging / wrangler runtime logger evidence は外部環境・ユーザー承認が必要なため、Phase 13 / G4 境界に残す。

## 必須 Evidence

| evidence | canonical path | 現状態 | 実行タイミング |
| --- | --- | --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` | PASS | `pnpm --filter @ubm-hyogo/web exec tsc -p tsconfig.json --noEmit` |
| lint | `outputs/phase-11/evidence/lint.log` | PASS | `pnpm --filter @ubm-hyogo/web lint` (`tsc` + ESLint) |
| test | `outputs/phase-11/evidence/test.log` | PASS | web Vitest 56 files / 441 tests PASS |
| build | `outputs/phase-11/evidence/build.log` | PASS | `pnpm --filter @ubm-hyogo/web build` |
| grep-gate | `outputs/phase-11/evidence/grep-gate.log` | PASS | 0 hits outside `src/lib/is-browser.ts` and `src/instrumentation-client.ts` |
| Sentry smoke | `outputs/phase-11/evidence/sentry-smoke.md` | runtime pending | staging / user approval 後 |
| runtime logger | `outputs/phase-11/evidence/runtime-logger.log` | runtime pending | wrangler dev または staging |

## Gate

Phase 12 compliance は local PASS 5 点セットと strict 7 outputs の実体確認を PASS にできる。Sentry dashboard smoke / runtime logger evidence は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として Phase 13 / G4 に残す。Phase 13 の commit / push / PR はユーザー明示許可まで実行しない。
