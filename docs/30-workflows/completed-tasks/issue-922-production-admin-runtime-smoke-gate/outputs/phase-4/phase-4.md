# Phase 4: テスト作成（TDD Red）

## 目的

command suite と expected result を作る。既存 staging gate test を雛形に production env path を追加する。

## 依存関係整合の事前チェック（FB-MSO-002）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build   # signSessionJwt を import するため
```

## テスト 1: `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts`（拡張）

既存 staging test に **production env path** の test ケースを追加する。

| ケース | 入力 | expected |
| ------ | ---- | -------- |
| TC-P1 production env prefix routing | CLI `production` + `PRODUCTION_AUTH_SECRET` 等 | `mintStagingSessionCookie` が production secret を使って cookie を発行 |
| TC-P2 staging env prefix routing（後方互換）| CLI 未指定 + `STAGING_AUTH_SECRET` 等 | staging gate と同等の挙動（既存 test 維持） |
| TC-P3 production env で `STAGING_*` を読まない | CLI `production` + `PRODUCTION_*` 設定済 + `STAGING_*` 未設定 | exit 0、`STAGING_*` 欠落で fail しない |
| TC-P4 staging env で `PRODUCTION_*` を読まない | CLI 未指定 + `STAGING_*` 設定済 + `PRODUCTION_*` 未設定 | exit 0、`PRODUCTION_*` 欠落で fail しない |
| TC-P5 production env で必須 env 欠落 | CLI `production` + `PRODUCTION_AUTH_SECRET` 未設定 | `process.exit(2)` + stderr に `PRODUCTION_AUTH_SECRET` 名のみ（値なし）|
| TC-P6 `resolveEnvPrefix` 純粋関数 test | `resolveEnvPrefix("production")` | `"PRODUCTION"` を返す |
| TC-P7 `resolveEnvPrefix` 未知 env | `resolveEnvPrefix("preview")` | throw（unknown env）|

期待コマンド:

```bash
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

## テスト 2: `scripts/smoke/__tests__/runtime-admin-web.test.sh`（拡張）

既存 staging shell test に production env path のケースを追加する。

| ケース | 条件 | expected exit | expected reason |
| ------ | ---- | ------------- | --------------- |
| TC-PA production env 引数受理 | `runtime-admin-web.sh production` + 必須 env 設定済 + curl stub 200 | 0 | PASS |
| TC-PB production target allowlist | `PRODUCTION_WEB_BASE=https://ubm-hyogo-web-production.daishimanju.workers.dev` | 0 | allowlist match |
| TC-PC production target allowlist 違反 | `PRODUCTION_WEB_BASE=https://evil.example.com` | 2 | target-allowlist |
| TC-PD production worker name 既定値 | env=production + `CF_WORKER_NAME` 未設定 | source guard で `ubm-hyogo-web-${ENVIRONMENT}` default を固定し、production path で `ubm-hyogo-web-production` へ解決 |
| TC-PE production env で `STAGING_WEB_BASE` を読まない | env=production + `STAGING_WEB_BASE` 設定 + `PRODUCTION_WEB_BASE` 未設定 | 2 | required env `PRODUCTION_WEB_BASE` |
| TC-PF production env で render error marker / digest 検出 | curl stub body に marker / tail stub に digest | 1 | server-components-render-error |
| TC-PG production env で auth 失敗 302 | curl stub 302 Location:/login | 1 | auth-token-invalid-or-expired |
| TC-PH 未知 env 引数 | `runtime-admin-web.sh preview` | 2 | Only staging or production runtime smoke is allowed |

期待コマンド:

```bash
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
```

## テスト 3: `cf.sh tail` 経由確認（既存 G-1 / TC-K を踏襲）

production runner も `wrangler tail` を直接呼ばず `cf.sh tail` 経由であることを grep で確認。
既存 staging test の G-1 で十分カバー済み（runner は env で分岐するが tail 呼び出し経路は共通）。

## テストパターンと命名規則の整合確認

- shell test は `*.test.sh`、TS test は `*.spec.ts`（CLAUDE.md 不変条件 8）。✅
- 既存ファイルへの追加で完結。新規 test ファイルは作らない（review surface 最小化）。
- stub は curl/wrangler を PATH 先頭の fake で差し替える方式（既存踏襲）。

## 完了判定

- [x] production env path / cross-env leak / allowlist / render fail path を focused tests と source guard で定義
- [x] env prefix routing の strict（cross-env leak 防止）を test 固定
- [x] 既存 staging test を破壊しない後方互換を test 化
