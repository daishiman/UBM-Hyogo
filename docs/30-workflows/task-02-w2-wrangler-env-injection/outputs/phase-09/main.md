# Phase 9 — 品質保証

## ローカルゲート結果

| ゲート | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 49 files / 417 tests PASS（env.test.ts 6 件 PASS）|
| grep AC-5 | `grep -rn 127.0.0.1:8888 apps/web/...` | 0 件 |
| grep AC-6 | `grep -rn process.env.NEXT_PUBLIC_API_BASE_URL apps/web/...`（env.ts 除外） | 0 件 |
| grep AC-9 | `grep -nE 'SENTRY_DSN_WEB\s*=\s*"http' apps/web/wrangler.toml` | 0 件 |

## 保留ゲート（user approval 後）

| ゲート | 理由 |
| --- | --- |
| `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | Cloudflare API Token を 1Password 経由で要求するため、user approval 後 |
| wrangler dev 実機 env 注入確認 | 同上 |

詳細は `grep-gate-result.md`。
