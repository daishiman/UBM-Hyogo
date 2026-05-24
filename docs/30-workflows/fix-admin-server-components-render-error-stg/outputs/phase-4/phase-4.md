# Phase 4: テスト作成（TDD Red）

## 4.1 追加・更新テストファイル

| パス | 種類 | 目的 |
| --- | --- | --- |
| `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | unit (vitest) | Cloudflare env binding 経由で admin API base URL / internal auth secret を解決し、missing base URL 時に localhost fallback へ進まないことを固定 |
| `apps/web/src/lib/__tests__/env.spec.ts` | unit (vitest) | `INTERNAL_AUTH_SECRET` optional schema を固定 |

## 4.2 TDD Red 期待

実装前は `server-fetch.ts` が `process.env["INTERNAL_API_BASE_URL"]` と `FALLBACK_INTERNAL_API` を使うため、Cloudflare env binding 経由 URL の assertion が fail する。

Broad grep guard は採用しない。`server-fetch.ts` には Playwright fixture 用の `NODE_ENV` / `PLAYWRIGHT_*` 判定があり、これは Node/test runtime 専用で Workers runtime の env 解決ではないため、runtime base URL と auth secret 解決だけを focused test で固定する。

## 4.3 Phase 2 命名規則整合チェック

- ファイル名: `*.spec.ts`
- mock 戦略: `vi.mock("@opennextjs/cloudflare")` と `vi.mock("next/headers")`
- regression 対象: `fetchAdmin()` public behavior 経由で private env resolver を観測

## 4.4 props vs internal state 確認

該当なし。NON_VISUAL / server helper のため UI props や internal component state はない。

## 4.5 実行コマンド

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
```
