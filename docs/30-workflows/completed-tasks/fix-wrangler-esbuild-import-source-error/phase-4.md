# Phase 4: 検証コマンド設計（RED）

本タスクはコード仕様のテストではなく **ビルド/デプロイ経路の回帰確認** が主検証対象。コマンドベースで RED 状態を定義する。

## 4.1 修正前（RED）に観測される現象

| # | コマンド | 期待される失敗 |
|---|---------|---------------|
| RED-1 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | `"import-source" is not a valid feature name for the "supported" setting` |
| RED-2 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | 同上 |
| RED-3 | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | 同上 |
| RED-4 | GitHub Actions `web-cd / deploy-staging` (#426) | `Build failed with 1 error` |
| RED-5 | GitHub Actions `backend-ci / deploy-staging` (#426) | `Build failed with 1 error` |

## 4.2 修正後（GREEN）の期待値

| # | コマンド | 期待結果 |
|---|---------|---------|
| GREEN-1 | `mise exec -- pnpm install --frozen-lockfile=false` | exit 0, esbuild 関連の version 更新が lockfile に反映 |
| GREEN-2 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0, `.open-next/worker.js` が生成 |
| GREEN-3 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0, "Successfully published" 相当の dry-run 出力 |
| GREEN-4 | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | exit 0 |
| GREEN-5 | `mise exec -- pnpm typecheck` | exit 0（regression 無し） |
| GREEN-6 | `mise exec -- pnpm lint` | exit 0（regression 無し） |

## 4.3 検証順序

1. GREEN-1（install）→ esbuild バイナリの platform 整合を確認。
2. GREEN-2 → GREEN-3（web 系）
3. GREEN-4（api 系）
4. GREEN-5 / GREEN-6（横断 regression）
5. 最後に PR を出して GitHub Actions で GREEN-4 / GREEN-5 を再現確認（Phase 13）。

## 4.4 environment 前提

- Node 24.15.0 / pnpm 10.33.2（`mise install` 済み）
- 1Password CLI 認証済み（`scripts/cf.sh` 経由で必要）
- `dry-run` のため Cloudflare API への実 publish は発生しない
