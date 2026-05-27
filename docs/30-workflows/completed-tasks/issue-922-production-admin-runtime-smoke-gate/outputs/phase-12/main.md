# Phase 12 Main — issue-922-production-admin-runtime-smoke-gate

## タスク要約

issue #922「production admin runtime smoke gate」の実装仕様書。親 #864 で確立した staging deploy 後の authenticated `/admin` runtime smoke gate を **production 層へ展開** する followup-001。runner / mint helper を env-aware に一般化し、`.github/workflows/web-cd.yml` に `needs: deploy-production` + `if: github.ref_name == 'main'` の `admin-runtime-smoke-production` job を追加する。issue #922 は CLOSED 状態を維持する。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`）
- strict 7 outputs（本 dir）
- `artifacts.json` / `outputs/artifacts.json`（gates: Gate-A passed / Gate-B pending）

## 実装対象（本 wave 実装計画）

| 区分 | パス |
| ---- | ---- |
| EDIT | `scripts/smoke/runtime-admin-web.sh`（env-aware 一般化）|
| EDIT | `scripts/smoke/mint-staging-session-cookie.mts`（`resolveEnvPrefix` + CLI 引数切替）|
| EDIT | `.github/workflows/web-cd.yml`（admin-runtime-smoke-production job 追加）|
| EDIT | test 2 件（production env path 拡張）|

## 状態

- workflow_state: `implemented_local_runtime_pending`
- Gate-A: passed（spec compliance）
- Gate-B: pending（Cloudflare production 実走 + 意図的 throw regression evidence + main required status check PUT = user-gated）
- issue #922: クローズ維持
