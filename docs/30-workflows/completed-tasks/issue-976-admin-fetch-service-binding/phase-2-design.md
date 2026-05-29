# Phase 2 — 設計

## 方針

`fetchAdmin` を以下の優先順で実装する(public.ts と整合):

1. **service-binding 経路** (production / staging で最優先)
   - `getPublicFetchEnv()` から `API_SERVICE` と runtime flag を取得し、`API_SERVICE.fetch(url, init)` を呼ぶ
   - URL は `https://internal/${path}` のような plausible absolute URL を組み立て (service-binding は host 部を無視するため任意のホストでよいが、`URL` parse 失敗を避けるため有効な URL 形式にする)。実装では既存の `INTERNAL_API_BASE_URL` を base にすると意味が明確
2. **HTTP fetch 経路** (test / Playwright / local dev)
   - `isTestOrPlaywright()`(`NODE_ENV === "test"` または `PLAYWRIGHT_TEST === "1"`)では HTTP fetch を優先(既存テストの mock fetch 経路を破壊しないため)
   - service-binding 未提供時も HTTP fetch にフォールバック

## API 設計

`fetchAdmin<T>(path, opts)` の外部 signature は変更しない。内部のみ:

```ts
// 擬似コード
export async function fetchAdmin<T>(path: string, opts: AdminFetchOptions = {}): Promise<T> {
  // 既存の env-gated fixture 早期 return 群は変更なし
  // ...

  const url = `${resolveApiBase()}${path}`;
  const headers: Record<string, string> = {
    "x-internal-auth": resolveInternalSecret(),
    accept: "application/json",
  };
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader) headers.cookie = cookieHeader;
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
    cache: "no-store",
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  };

  const binding = getServiceBindingForAdmin();
  const fetcher = binding ? binding.fetch.bind(binding) : fetch;

  const res = await fetcher(url, init);
  if (!res.ok) {
    let bodySnippet = "";
    try {
      const text = await res.text();
      if (text) bodySnippet = ` body=${text.slice(0, 256)}`;
    } catch {}
    throw new Error(`admin api ${path} failed: ${res.status}${bodySnippet}`);
  }
  return (await res.json()) as T;
}

function getServiceBindingForAdmin(): { fetch: typeof fetch } | undefined {
  const env = getPublicFetchEnv();
  if (isTestOrPlaywright(env)) return undefined; // mock fetch 経路を維持
  return env.API_SERVICE; // production / staging
}

function isTestOrPlaywright(env: { NODE_ENV?: string; PLAYWRIGHT_TEST?: string }): boolean {
  return env.NODE_ENV === "test" || env.PLAYWRIGHT_TEST === "1";
}
```

## env accessor

`apps/web/src/lib/env.ts` の `getPublicFetchEnv()` は `API_SERVICE?: ServiceBinding`、`NODE_ENV`、`PLAYWRIGHT_TEST` を返すため新規追加なし。`getEnv()` は `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` など必須 server env の解決に限定し、service-binding と runtime flag の判定は `getPublicFetchEnv()` に寄せる。

## 設計上の判断

- service-binding 経由でも `x-internal-auth` / cookie ヘッダは init に乗せれば API 側 Hono router に通常通り渡る(Workers service-binding は Request オブジェクトを subrequest として再評価する)
- URL の host 部はダミーで可。ただし `URL` parse 通過のため `INTERNAL_API_BASE_URL` の絶対 URL を素直に使う(既存の `resolveApiBase()` を再利用)
