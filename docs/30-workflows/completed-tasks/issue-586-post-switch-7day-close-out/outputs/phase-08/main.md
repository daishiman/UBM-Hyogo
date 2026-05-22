# Phase 8 — 品質ゲート / セキュリティ / governance

## 品質ゲート

| ゲート | 結果 |
| --- | --- |
| `pnpm typecheck` | OK_LOCAL（5 workspace 全 Done。tee 経由で `evidence/typecheck.log` 取得） |
| `pnpm lint` | OK_LOCAL（dependency-cruiser 0 violation / stablekey-literal-lint OK / 5 workspace 全 Done） |
| focused vitest | OK_FOCUSED（25/25） |
| secret-leakage-grep（observation 形状） | clean |
| `pnpm build` | OK_BUILD（Next.js middleware deprecation / Prisma instrumentation warning のみ） |

## セキュリティ

- 実 token / model path 値は記録しない。`vars.CF_AUDIT_CLASSIFIER=ml` と `secrets.CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみ
- 1Password 由来の値はワークフロー上では `${{ secrets.* }}` 経由で注入。ローカル shell history・コミットログ・evidence ファイルに残さない
- D1 schema 変更 0（forward-safe rollback 1 行: `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"`）

## governance

- branch protection / CODEOWNERS には触らない
- Issue #549 / #586 は CLOSED のまま `Refs #549, Refs #586` のみで連携
- production env mutation は user 承認済みの `gh api -X POST` 1 回のみ
