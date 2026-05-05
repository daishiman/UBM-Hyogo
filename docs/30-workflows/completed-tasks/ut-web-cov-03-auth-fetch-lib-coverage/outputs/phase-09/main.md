# outputs phase 09: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / implemented-local]

## 実行 gate ログ要約

| # | gate | コマンド | exit code | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | 0 | Node 22 engine warningあり |
| 2 | lint | `pnpm lint` | 0 | stablekey literal 148 violationsは warning-mode existing baseline |
| 3 | test+coverage | `pnpm --filter @ubm-hyogo/web test:coverage` | 0 | 40 files / 359 tests passed |
| 4 | coverage 数値検証 | `apps/web/coverage/coverage-summary.json` parse | 0 | 対象6ファイル + helper が閾値クリア |
| 5 | regression | web Vitest full coverage run | 0 | failing test 0 |

## coverage 抜粋

| file | Stmts | Lines | Funcs | Branches |
| --- | --- | --- | --- | --- |
| apps/web/src/lib/auth.ts | 89.9 | 89.9 | 90 | 88.76 |
| apps/web/src/lib/auth/magic-link-client.ts | 100 | 100 | 100 | 100 |
| apps/web/src/lib/auth/oauth-client.ts | 100 | 100 | 100 | 100 |
| apps/web/src/lib/session.ts | 100 | 100 | 100 | 100 |
| apps/web/src/lib/fetch/authed.ts | 100 | 100 | 100 | 100 |
| apps/web/src/lib/fetch/public.ts | 100 | 100 | 100 | 100 |
| apps/web/src/test-utils/fetch-mock.ts | 97.87 | 97.87 | 100 | 92.3 |

## 失敗 gate と対応

- 初回追加の `fetch-mock.test.ts` は `mockRejectedValueOnce` を2回消費して失敗したため、期待を1回の fetch に集約して修正済み。
- 再実行で `pnpm --filter @ubm-hyogo/web test:coverage` は exit 0。
- `pnpm --filter @ubm-hyogo/web typecheck` と `pnpm lint` も exit 0。
