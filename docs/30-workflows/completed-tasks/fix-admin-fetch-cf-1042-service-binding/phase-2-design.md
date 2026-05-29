# Phase 2: 設計

## 設計方針

`apps/web/src/lib/fetch/public.ts` の transport selector pattern を `fetchAdmin` に機械的に適用する。新規抽象化は導入しない（CLAUDE.md「Don't add features beyond what the task requires」原則）。

## transport 決定ロジック（純関数）

```
service-binding を使う条件:
  env.API_SERVICE が存在し、かつ
  NOT (isTestOrPlaywright() AND env.INTERNAL_API_BASE_URL が明示されている)

それ以外:
  HTTP fetch ({{INTERNAL_API_BASE_URL}}${path}, x-internal-auth header 付き)
```

> `fetchPublic` との差: admin は `cookie` header と `x-internal-auth` を必ず伝搬する必要があるため、binding 経路でも HTTP 経路でも同一 header set を組み立ててから transport を選ぶ。

## 変更後の `fetchAdmin` 構造

```ts
export async function fetchAdmin<T>(path: string, opts: AdminFetchOptions = {}): Promise<T> {
  // (1) playwright/test fixture early-return ブロックは現状維持
  // ...

  const headers = await buildAdminRequestHeaders(opts);
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
    cache: "no-store",
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  };

  const binding = getAdminServiceBinding();
  let response: Response;
  if (binding) {
    const url = `https://service-binding.local${path}`;
    response = await binding.fetch(url, init);
    logAdminTransport("service-binding", path, response.status);
  } else {
    const url = `${resolveApiBase()}${path}`;
    response = await fetch(url, init);
    logAdminTransport("http-fallback", path, response.status);
  }

  if (!response.ok) {
    let bodySnippet = "";
    try {
      const text = await response.text();
      if (text) bodySnippet = ` body=${text.slice(0, 256)}`;
    } catch { /* noop */ }
    throw new Error(`admin api ${path} failed: ${response.status}${bodySnippet}`);
  }
  return (await response.json()) as T;
}
```

## 新規 helper（同一ファイル内、export しない）

| 関数 | 役割 |
|------|------|
| `buildAdminRequestHeaders(opts)` | cookie + x-internal-auth + accept + content-type を一括組み立て |
| `getAdminServiceBinding()` | test/Playwright かつ `INTERNAL_API_BASE_URL` 明示時は `undefined`、それ以外は `getEnv().API_SERVICE` |
| `isTestOrPlaywright()` | `getEnv()` の `NODE_ENV` / `PLAYWRIGHT_TEST` を参照（`fetchPublic` 側と同じ判定） |
| `logAdminTransport(transport, path, status)` | `console.log({ transport, path: stripQuery(path), status })` |

## env accessor の確認

- `getEnv()` 既存 schema に `API_SERVICE?: ServiceBinding` が含まれることを確認済み（`apps/web/src/lib/env.ts` L54）
- `NODE_ENV` / `PLAYWRIGHT_TEST` も `getEnv()` 経由（`fetchPublic` が既に使用している `getPublicFetchEnv` と同じ source。admin 側は `getEnv()` を直接使ってよい）

## エラーハンドリング

- service-binding 経由でも HTTP 経由でも `response.ok === false` のとき同じ throw 文（`admin api ${path} failed: ${status} body=...`）。UI 側 (`safe-server-fetch.ts`) の `ADMIN_FETCH_*` code 分類 (404 / 5xx / network) はそのまま動作する。
- service binding が runtime に存在しない場合（local dev）は HTTP fallback で動作継続。

## test design（Phase 4 の前提）

`apps/web/src/lib/fetch/public.spec.ts` をテンプレートとして以下 6 ケース:

1. service-binding 経路: `API_SERVICE.fetch` が呼ばれる + 渡される URL host が `service-binding.local`
2. service-binding 経路: cookie header / x-internal-auth が伝搬する
3. http-fallback 経路: `INTERNAL_API_BASE_URL + path` が叩かれる
4. http-fallback 経路: NODE_ENV=test かつ INTERNAL_API_BASE_URL 明示時に binding が無視される
5. error body propagation: 404 + body `error code: 1042` のとき `body=error code: 1042` が message に含まれる（**今回の bug の regression guard**）
6. body の 256 文字 truncate

## ライブラリ選定

新規ライブラリなし。

## 命名衝突チェック

- `fetchPublic` 側の `getServiceBinding` / `getBaseUrl` と被らないよう admin 側は `getAdminServiceBinding` / `resolveApiBase`（既存）を維持。
