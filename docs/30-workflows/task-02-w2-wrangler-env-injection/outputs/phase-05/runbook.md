# 実装ランブック（実行順）

| # | step | 実体 | status |
| --- | --- | --- | --- |
| 1 | `apps/web/wrangler.toml` の 3 環境 `[vars]` 整理 | wrangler.toml | done |
| 2 | `apps/web/.dev.vars.example` 新規作成（op 参照のみ） | .dev.vars.example | done |
| 3 | `apps/web/src/lib/env.ts` 新規作成（zod schema + getEnv/getPublicEnv） | env.ts | done |
| 4 | `apps/web/src/lib/__tests__/env.test.ts` 新規作成（6 ケース） | env.test.ts | done |
| 5 | `next.config.ts` 最小編集（現行 `env` block 不在 → 変更なし） | next.config.ts | not required (AC-11) |
| 6 | `127.0.0.1:8888` / `process.env.NEXT_PUBLIC_API_BASE_URL` の grep & 移行 | grep gate | 0 件で確認済 |
| 7 | typecheck / lint / test 実行 | pnpm | PASS |
| 8 | wrangler dev / staging dry-run | scripts/cf.sh | user approval 後（phase-13） |

## 実行コマンド集

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test
grep -rn "127\.0\.0\.1:8888" apps/web/src apps/web/next.config.ts apps/web/wrangler.toml
grep -rn "process\.env\.NEXT_PUBLIC_API_BASE_URL" apps/web/src apps/web/next.config.ts | grep -v "src/lib/env.ts"
```
