# Phase 1 — 要件定義

## 真の論点

| # | 論点 | 結論 |
| --- | --- | --- |
| Q1 | env 注入経路を build-time bake-in / runtime context / process.env 直参照のどれに統一するか | runtime `getCloudflareContext().env`（Workers）+ Node `process.env`（build/test）二経路 + zod parse で統一 |
| Q2 | `127.0.0.1:8888` 焼き込み撲滅 | grep gate 0 件で機械検証（AC-5）。現行 apps/web 配下 0 件確認済 |
| Q3 | secret の wrangler.toml 露出禁止 | `SENTRY_DSN_WEB` / `AUTH_SECRET` は Cloudflare Secrets / 1Password 正本（AC-9） |
| Q4 | 公開 env と private env の境界 | `getEnv()`（fullset）/ `getPublicEnv()`（`ENVIRONMENT` + `NEXT_PUBLIC_API_BASE_URL` のみ）に分離 |
| Q5 | task-03 sentry-workers-sdk-unify との並列衝突 | `[vars]` は本タスク owner、`[observability]`/instrumentation は task-03 owner（Schema Ownership 宣言） |
| Q6 | `process.env.NEXT_PUBLIC_*` 直接参照禁止の機械化 | grep gate AC-6（env.ts 以外で 0 件）、CI gate に task-18 で接続 |

## AC-1〜11 確定

index.md の AC 表をそのまま採用。Phase 7 で test/不変条件にトレースする。

## automation-30 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 矛盾なし | wrangler.toml の `[vars]` と `EnvSchema` のキー集合が一致（PUBLIC/INTERNAL/AUTH/SENTRY 系すべて）|
| 漏れなし | `.dev.vars.example` に local 用の全 key を列挙、secret は op 参照 |
| 整合性あり | 3 環境（local / staging / production）で同じキーセット、値のみ環境差分 |
| 依存関係整合 | task-04 / task-05 / task-18 は `getEnv()` 公開 API のみ参照（直アクセス禁止） |

## scope ゲート（19 routes 影響）

env 注入は全 19 routes 共通基盤。route 単位の UI 変更ゼロ・API endpoint 追加ゼロ。
