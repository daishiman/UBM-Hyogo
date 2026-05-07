# Phase 11 — 実装 smoke

## ローカル実機検証（取得済）

| 項目 | コマンド | 結果 | evidence |
| --- | --- | --- | --- |
| env unit test | `pnpm --filter @ubm-hyogo/web vitest run apps/web/src/lib/__tests__/env.test.ts` | 6 PASS | `evidence/env-test-output.txt` |
| typecheck / lint / build summary | `pnpm --filter @ubm-hyogo/web typecheck` / `lint` | PASS（0 errors） | `evidence/build-output.txt` |
| grep gate（AC-5 / AC-6 / AC-9） | `grep -rn ...` | 0 件 / 0 件 / 0 件 | `evidence/grep-fallback-zero.txt` |

## 保留 evidence（user approval 後の Cloudflare 実機）

| 項目 | コマンド | evidence |
| --- | --- | --- |
| wrangler dev 実機 env 注入 | `bash scripts/cf.sh wrangler dev --config apps/web/wrangler.toml`（手動） | `evidence/wrangler-dev-log.txt`（pending） |
| staging dry-run | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | `evidence/staging-dry-run.txt`（pending） |

UI/UX 変更は本タスクに含まれない（プラットフォーム層・env 注入のみ）ため、スクリーンショット evidence は対象外。

## UI/UX スクリーンショット非該当の根拠

19 routes の UI に対する変更ゼロ・コンポーネント追加ゼロ。本タスクは `apps/web/wrangler.toml` / `apps/web/src/lib/env.ts` / `apps/web/.dev.vars.example` / その unit test の追加のみで、ブラウザに描画される変更を含まない。
