# Implementation Guide

## Part 1: 中学生レベル

Web Worker と API Worker は同じ Cloudflare の中にあります。これまでは、同じ建物の隣の部屋へ行くのに、いったん外の道路へ出て正面玄関から入り直そうとしていました。Cloudflare はこの回り道を止めることがあり、その結果が `error code: 1042` です。

Service Binding は建物内の内線電話です。`fetchAdmin` は、Cloudflare 上では内線電話で API Worker を呼び、ローカルやテストでは今まで通り住所を指定して HTTP で呼びます。

## Part 2: 技術者レベル

Changed files:

| Path | Change |
| --- | --- |
| `apps/web/src/lib/env.ts` | Added `getAdminFetchEnv()` for `API_SERVICE`, `INTERNAL_API_BASE_URL`, `NODE_ENV`, `PLAYWRIGHT_TEST` without weakening full `getEnv()` validation. |
| `apps/web/src/lib/admin/server-fetch.ts` | Added admin service-binding selector, shared header builder, `service-binding` / `http-fallback` transport log, and kept existing error body propagation. |
| `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | Covers binding URL, headers/body propagation, CF 1042 body propagation, and body truncation. |
| `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | Covers binding absence and test override fallback. |
| `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` | Updated env mock for the new accessor while preserving trailing slash regression coverage. |

Transport rule:

```ts
if (env.API_SERVICE && !(isTestOrPlaywright && env.INTERNAL_API_BASE_URL)) {
  API_SERVICE.fetch(`https://service-binding.local${path}`, init);
} else {
  fetch(`${resolveApiBase()}${path}`, init);
}
```

`resolveApiBase()` now prefers `getAdminFetchEnv().INTERNAL_API_BASE_URL` for test/Playwright overrides, then falls back to validated `getEnv().INTERNAL_API_BASE_URL`.

## Verification

```bash
mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch.binding.spec.ts src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts src/lib/admin/__tests__/server-fetch-url.spec.ts src/lib/admin/__tests__/server-fetch.env.spec.ts
```

Result: PASS (`175 passed | 1 skipped`, `1229 passed | 1 skipped`).
