# Phase 5: 実装

## 変更ファイル一覧

| 種別 | パス |
|------|------|
| 編集 | `apps/web/src/lib/admin/server-fetch.ts` |
| 新規 | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` |
| 新規 | `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` |

> `apps/web/src/lib/env.ts` は既に `API_SERVICE?: ServiceBinding` を露出済みのため変更不要。

## 実装手順

### Step 1: helper の追加（`server-fetch.ts` 内、private）

```ts
import { getEnv } from "../env";

function isTestOrPlaywright(): boolean {
  const env = getEnv();
  return env.NODE_ENV === "test" || env.PLAYWRIGHT_TEST === "1";
}

function getAdminServiceBinding(): { fetch: typeof fetch } | undefined {
  const env = getEnv();
  // test/CI: INTERNAL_API_BASE_URL 明示時は HTTP 経路を優先（既存 spec 互換）
  if (isTestOrPlaywright() && env.INTERNAL_API_BASE_URL) return undefined;
  return env.API_SERVICE;
}

async function buildAdminRequestHeaders(opts: AdminFetchOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "x-internal-auth": resolveInternalSecret(),
    accept: "application/json",
  };
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader) headers.cookie = cookieHeader;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  return headers;
}

function logAdminTransport(
  transport: "service-binding" | "http-fallback",
  path: string,
  status: number,
): void {
  console.log({ transport, scope: "admin", path: path.split("?")[0], status });
}
```

### Step 2: `fetchAdmin` の transport 分岐を差し込む

既存 fixture early-return ブロック群（`PLAYWRIGHT_TASK18_SMOKE` 等）は **変更しない**。
fixture 判定の後、URL/header 組み立て直前から binding 分岐を入れる:

```ts
const headers = await buildAdminRequestHeaders(opts);
const init: RequestInit = {
  method: opts.method ?? "GET",
  headers,
  cache: "no-store",
  ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
};

const binding = getAdminServiceBinding();
let res: Response;
if (binding) {
  res = await binding.fetch(`https://service-binding.local${path}`, init);
  logAdminTransport("service-binding", path, res.status);
} else {
  res = await fetch(`${resolveApiBase()}${path}`, init);
  logAdminTransport("http-fallback", path, res.status);
}

if (!res.ok) {
  let bodySnippet = "";
  try {
    const text = await res.text();
    if (text) bodySnippet = ` body=${text.slice(0, 256)}`;
  } catch {
    // body 読み取り失敗は致命的でない
  }
  throw new Error(`admin api ${path} failed: ${res.status}${bodySnippet}`);
}
return (await res.json()) as T;
```

### Step 3: test ファイル作成

Phase 4 の TC-B1〜TC-H3 を実装。`apps/web/src/lib/fetch/public.spec.ts` の以下要素を模倣:

- `cloudflareEnv` mutable object
- `vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => ({ env: cloudflareEnv }) }))`
- `vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "session=abc" }) }))`
- `bindingFetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))`

binding 経路の host 確認は `bindingFetch.mock.calls[0][0]` を assert する。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD

- 全 8 ケース green
- `pnpm typecheck` / `pnpm lint` green
- `apps/web/src/lib/admin/server-fetch.ts` の差分が「transport 分岐 + private helper 3 個追加」のみで、既存 fixture 群と export 形は不変
- `git diff` 差分行数 ≤ 100 行（target）
