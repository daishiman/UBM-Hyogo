# Phase 12 main — issue-1137-bulk-tag-production-runtime-smoke

## タスク要約

issue #1137「bulk tag endpoint の production runtime smoke 拡張」を `implemented_local_runtime_pending` として実装・同期した。issue-1081 が確立した staging bulk tag mutation runtime smoke を、production Workers（`ubm-hyogo-api` / `https://api.ubm-hyogo.workers.dev`）+ production real D1（`ubm-hyogo-db-prod`）への mutation smoke へ拡張した。

## 成果物（本サイクルで実装済み）

| # | 成果物 | 種別 | 状態 |
| - | ------ | ---- | ---- |
| 1 | `scripts/smoke/runtime-tag-bulk.sh`（production env 受理 + `assert_production_guard` + dual marker + env 別変数） | 編集 | implemented_local_runtime_pending |
| 2 | `apps/api/migrations/seed/bulk-tag-production-seed.sql` | 新規 | implemented_local_runtime_pending |
| 3 | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` | 新規 | implemented_local_runtime_pending |
| 4 | `.github/workflows/production-runtime-smoke.yml`（`bulk-tag-production-runtime-smoke` job 追加） | 編集 | implemented_local_runtime_pending |
| 5 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（production guard test 追加） | 編集 | implemented_local_runtime_pending |
| 6 | runbook + Phase 11 evidence ledger | docs | implemented_local_runtime_pending |

## 状態

- `workflow_state` = `implemented_local_runtime_pending`（runner・SQL・CI・local test 実装済み。production runtime evidence のみ未取得）。
- Phase 1-10/12 = completed、Phase 11 = runtime_pending_user_approval、Phase 13 = pending_user_approval。
- Gate-A = passed（local implementation + spec compliance）、Gate-B / Gate-C = pending。
- issue #1137 は CLOSED 維持（state 変更なし）。

## user-gated 境界

本サイクルでは production real D1 実走、commit、push、PR は行わない。production real D1 への seed / mutation / cleanup 実走証跡取得は user 二重承認後のみ（Gate-B）。
