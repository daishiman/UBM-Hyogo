# Phase 4 成果物: 検証コマンド設計（RED → GREEN）

本タスクはコード仕様のテストではなく**ビルド/デプロイ経路の回帰確認**が主検証対象。コマンドベースで RED / GREEN を定義する。

## RED（修正前に観測される失敗）
| # | コマンド | 期待される失敗 |
|---|---------|---------------|
| RED-1 | `pnpm --filter @ubm-hyogo/web build:cloudflare` | `"import-source" is not a valid feature name for the "supported" setting` |
| RED-2 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | 同上 |
| RED-3 | `pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | 同上 |
| RED-4 | GitHub Actions `web-cd / deploy-staging` | `Build failed with 1 error` |
| RED-5 | GitHub Actions `backend-ci / deploy-staging` | `Build failed with 1 error` |

## GREEN（修正後に期待）
| # | コマンド | 期待 |
|---|---------|------|
| GREEN-1 | `mise exec -- pnpm install --frozen-lockfile=false` | exit 0、lockfile に esbuild 関連 entry 更新 |
| GREEN-2 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` 生成 |
| GREEN-3 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0 |
| GREEN-4 | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | exit 0 |
| GREEN-5 | `mise exec -- pnpm typecheck` | exit 0 |
| GREEN-6 | `mise exec -- pnpm lint` | exit 0 |

## 環境前提
- Node 24.15.0 / pnpm 10.33.2
- `dry-run` のため Cloudflare API への実 publish は発生しない
