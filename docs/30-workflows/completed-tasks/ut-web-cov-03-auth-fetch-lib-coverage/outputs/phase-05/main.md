# outputs phase 05: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: planned
- purpose: 実装ランブック手順表
- evidence: `apps/web/coverage/coverage-summary.json`（実測時に capture）

## 着手順序（依存少 → 依存多）

| Step | 新規 test ファイル | 対象実装 | 依存 mock | 完了確認コマンド |
|---|---|---|---|---|
| 1 | `apps/web/src/lib/api/me-types.test-d.ts` | `me-types.ts` | なし（type-only） | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/api/me-types.test-d.ts` |
| 2 | `apps/web/src/lib/auth/oauth-client.test.ts` | `oauth-client.ts` | `next-auth/react` | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth/oauth-client.test.ts` |
| 3 | `apps/web/src/lib/auth/magic-link-client.test.ts` | `magic-link-client.ts` | global fetch | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth/magic-link-client.test.ts` |
| 4 | `apps/web/src/lib/session.test.ts` | `session.ts` | `@/lib/auth` | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/session.test.ts` |
| 5 | `apps/web/src/lib/fetch/public.test.ts` | `fetch/public.ts` | `@opennextjs/cloudflare` + fetch | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/fetch/public.test.ts` |
| 6 | `apps/web/src/lib/fetch/authed.test.ts` | `fetch/authed.ts` | `next/headers` + fetch | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/fetch/authed.test.ts` |
| 7 | `apps/web/src/lib/auth.test.ts` | `auth.ts` | next-auth, providers, fetch | `mise exec -- pnpm --filter web vitest run apps/web/src/lib/auth.test.ts` |

## helper

- `apps/web/src/test-utils/fetch-mock.ts`（Phase 8 で抽出）
- API: `mockFetchOnce` / `mockFetchSequence` / `mockFetchNetworkError` / `restoreFetch`

## 設定変更

- root `vitest.config.ts` の `coverage.exclude` に `apps/web/src/lib/api/me-types.ts` を追加。

## PR 分割方針

- 1 タスク = 1 PR、base = `dev`。
- 含める変更: 7 test + 1 helper + vitest config 1 行。プロダクションコード変更なし。

## DoD

- 全 step で `vitest run` 緑。
- `pnpm --filter web test:coverage` で対象 7 ファイルが Stmts/Lines/Funcs ≥85%, Branches ≥80%。
- 既存 test に regression なし。
