# Phase 11 source-level smoke ログ — AdminFetchError typed class

**[実装区分: 実装仕様書]**

> NON_VISUAL タスクのため UI smoke は不要。source-level smoke（静的確認 + focused test）で代替し、本サイクルで実測済み。

## source-level smoke 項目（製品コード）

| # | コマンド | 期待 | 実測 |
| --- | --- | --- | --- |
| S-1 | `grep -n "throw new Error(\`admin api" apps/web/src/lib/admin/server-fetch.ts` | 0 件（旧 untyped throw 撤去） | _（実装後）_ |
| S-2 | `grep -n "export class AdminFetchError" apps/web/src/lib/admin/server-fetch.ts` | 1 件 | _（実装後）_ |
| S-3 | `grep -n "AdminFetchError" apps/web/src/lib/server-fetch/safe-fetch.ts` | 0 件（共通層 admin 非依存） | _（実装後）_ |
| S-4 | `mise exec -- pnpm exec vitest run apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts` | TC-AFE 全 PASS | _（実装後）_ |
| S-5 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | green | _（実装後）_ |
| S-6 | `mise exec -- pnpm lint` | green | _（実装後）_ |

## 環境ブロッカー（製品コードと別カテゴリ / WEEKGRD-01）
- worktree 直後の esbuild darwin バイナリ mismatch（FB-MSO-002）→ `pnpm install` で解消。製品コードの問題ではない。

## runtime smoke（user-gated）
- staging deploy 後の `wrangler tail` で 404 時 `[admin/server-fetch] 404` ログが出ること = user-gated（本サイクル対象外）。
