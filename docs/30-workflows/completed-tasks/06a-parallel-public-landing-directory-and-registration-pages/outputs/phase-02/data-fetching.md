# data-fetching.md — RSC fetch + revalidate

## 共通 helper (apps/web/src/lib/fetch/public.ts)

```ts
const DEFAULT_BASE_URL = "http://localhost:8787";

export async function fetchPublic<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const baseUrl = process.env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
  const { revalidate = 30, ...rest } = init ?? {};
  const r = await fetch(`${baseUrl}${path}`, {
    ...rest,
    next: { revalidate },
    headers: {
      Accept: "application/json",
      ...(rest.headers ?? {}),
    },
  });
  if (!r.ok) {
    throw new Error(`fetchPublic ${path} ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export class FetchPublicNotFound extends Error {
  constructor(path: string) {
    super(`fetchPublic ${path} 404`);
  }
}

export async function fetchPublicOrNotFound<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const baseUrl = process.env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
  const { revalidate = 30, ...rest } = init ?? {};
  const r = await fetch(`${baseUrl}${path}`, {
    ...rest,
    next: { revalidate },
    headers: { Accept: "application/json", ...(rest.headers ?? {}) },
  });
  if (r.status === 404) throw new FetchPublicNotFound(path);
  if (!r.ok) throw new Error(`fetchPublic ${path} ${r.status}`);
  return r.json() as Promise<T>;
}
```

## route × endpoint × revalidate

| route | endpoint | revalidate | 理由 |
| --- | --- | --- | --- |
| `/` | `GET /public/stats` | 60s | stats は schemaSync / responseSync に追従 |
| `/` | `GET /public/members?limit=6` | 60s | featured 6 件、stats と同周期 |
| `/members` | `GET /public/members?{q,zone,status,tag,sort,density,page,limit}` | 30s | 検索結果は鮮度優先 |
| `/members/[id]` | `GET /public/members/:id` | 60s | プロフィール変更追従 |
| `/register` | `GET /public/form-preview` | 600s | form schema は cron 同期、長め |

## エラーハンドリング

| 状態 | 挙動 | 不変条件 |
| --- | --- | --- |
| 200 | 表示 | - |
| 404 (`/members/[id]` のみ) | `notFound()` | #5 |
| 5xx | `error.tsx` boundary | #5/#10 |
| `/register` で `/public/form-preview` 5xx | warning + responderUrl のみ表示 | - |

## 認可境界

- 公開層は session 不要
- `responseEmail` / `rulesConsent` / `adminNotes` 等の system field は 04a 側で除去済み（fail-close）
- 不適格メンバー（publishState != public, publicConsent != consented, isDeleted）は 04a が 404 → `notFound()`
