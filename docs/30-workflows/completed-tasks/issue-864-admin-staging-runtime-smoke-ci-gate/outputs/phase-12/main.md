# Phase 12 Main — issue-864-admin-staging-runtime-smoke-ci-gate

## タスク要約

issue #864「admin staging runtime smoke CI gate」の実装仕様書。staging deploy 後に authenticated `/admin` を実トラフィックで叩き、Server Components render error（digest=167275886）の再発を CI で自動検出する gate を新設する。root-cause render error は親タスク + #877/#862/#863 で修正済み。本タスクは回帰防止 gate の新設に限定する。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`）
- strict 7 outputs（本 dir）
- `artifacts.json` / `outputs/artifacts.json`（gates: Gate-A passed / Gate-B pending）

## 実装対象（本 wave 実装済み）

| 区分 | パス |
| ---- | ---- |
| EDIT | `scripts/cf.sh`（tail subcommand） |
| NEW  | `scripts/smoke/mint-staging-session-cookie.mts` |
| NEW  | `scripts/smoke/runtime-admin-web.sh` |
| EDIT | `.github/workflows/web-cd.yml`（admin-runtime-smoke job） |
| NEW  | test 2 件 |

## 状態

- workflow_state: `implemented_local_runtime_pending`
- Gate-A: passed（spec compliance）
- Gate-B: pending（Cloudflare staging 実走 = user-gated）
- issue #864: クローズ維持
