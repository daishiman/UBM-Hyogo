# Phase 4 — テスト計画

## 新規 spec

`apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`

### ケース

1. **service-binding 経路採用**
   - `getPublicFetchEnv()` mock で `API_SERVICE: { fetch: bindingFetch }` を提供、`NODE_ENV=production` 相当
   - `fetchAdmin("/admin/meetings")` 実行
   - assert: `bindingFetch` が 1 回呼ばれること、global `fetch` が呼ばれないこと
   - assert: 渡される `init.headers` に `x-internal-auth` と `cookie` (mock) が含まれること

2. **HTTP fallback (binding 未提供)**
   - `API_SERVICE: undefined`、`NODE_ENV=production`
   - assert: global `fetch` が呼ばれ、URL が `${INTERNAL_API_BASE_URL}/admin/meetings`

3. **test runtime fallback**
   - `API_SERVICE: { fetch: bindingFetch }` 提供、`NODE_ENV=test`
   - assert: `bindingFetch` は呼ばれず、global `fetch` が呼ばれる(既存 mock 経路維持)

4. **PLAYWRIGHT_TEST=1 runtime fallback**
   - `API_SERVICE: { fetch: bindingFetch }` 提供、`PLAYWRIGHT_TEST=1`
   - assert: `bindingFetch` は呼ばれず、global `fetch` が呼ばれる

5. **error path / body snippet 維持**
   - `bindingFetch` を 404 + body `"not found long body"` で mock
   - assert: throw された Error message が `admin api /admin/meetings failed: 404 body=not found long body` を含む

6. **method / body 透過**
   - `fetchAdmin("/admin/meetings", { method: "POST", body: { title: "x" } })`
   - assert: bindingFetch 呼び出しの `init.method === "POST"`、`init.body === '{"title":"x"}'`、`init.headers["content-type"] === "application/json"`

## 既存 spec の再実行確認

- `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts`
- `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts`
- 他 `apps/web/src/lib/admin/__tests__/*.spec.ts`

すべて test runtime で HTTP fallback 経路に流れるため変更不要、pass 維持を確認。

## fixture mock 経路の非破壊確認

`PLAYWRIGHT_TASK18_SMOKE` / `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE` / `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE` / `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE` / `PLAYWRIGHT_ISSUE776_SCHEMA_BULK_FIXTURE` / `PLAYWRIGHT_TASK17_ADMIN_FIXTURE` の早期 return ロジックは `fetchAdmin` 冒頭にあり、service-binding 切替より上流。変更しない。
