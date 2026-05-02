---
name: architecture-admin-api-client
description: UBM 兵庫支部会 apps/web の admin API クライアント層仕様。`lib/admin/api.ts`（Client mutation）/ `lib/admin/server-fetch.ts`（Server fetch）/ `app/api/admin/[...path]` BFF proxy のシグネチャ・キャッシュ戦略・認証ヘッダ伝搬・エラー処理方針を定義する。
slug: architecture-admin-api-client
---

# Architecture — Admin API Client / BFF Proxy

> 本ドキュメントは UBM 兵庫支部会システムの apps/web 側 admin API アクセス層を定義する。
> 不変条件 #5（apps/web から D1 直接アクセス禁止）の遵守経路を一意にするための正本。
> 詳細出典: `apps/web/src/lib/admin/{api.ts,server-fetch.ts}`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/app/(admin)/layout.tsx`, `docs/30-workflows/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/outputs/phase-02/admin-pages-design.md`, `phase-12/implementation-guide.md`

---

## 1. 構成図

```
[Browser]
  │
  │  (1) Server Component 初期描画
  │      → fetchAdmin()  [server-fetch.ts]
  │           ┌─ INTERNAL_API_BASE_URL に直接 fetch
  │           ┕─ x-internal-auth + cookie を付与
  │
  │  (2) Client mutation (PATCH/POST/DELETE)
  │      → call() in api.ts
  │           ┕─ /api/admin/* (同一 origin)
  │
[apps/web Worker]
  │
  │  /api/admin/[...path] route handler  ← BFF proxy
  │    - auth() で session.isAdmin 再検証 → 失敗時 403
  │    - cookie / authorization / content-type を伝搬
  │    - x-internal-auth を付与して upstream へ
  │
[apps/api Worker]  /admin/*
  └─ Hono ルータ → D1
```

主要原則:

- 不変条件 #5: apps/web は D1 へ直接アクセスしない。**必ず apps/api 経由**。
- Server Component → `fetchAdmin()` で apps/api を直接呼ぶ（同一 Cloudflare アカウント内 worker-to-worker fetch）。
- Client Component → 同一 origin `/api/admin/*` proxy 経由（CSRF / cookie 配送を Next.js に乗せるため）。
- admin gate は二段: `(admin)/layout.tsx`（UI 進入時）+ `/api/admin/[...path]`（API 進入時）。

---

## 2. Server-side fetch（`apps/web/src/lib/admin/server-fetch.ts`）

### 2.1 公開 API

```ts
export interface AdminFetchOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
}

export async function fetchAdmin<T>(
  path: string,
  opts?: AdminFetchOptions
): Promise<T>;
```

- `path` は `/admin/...` で始まる apps/api 側パス。
- 戻り値は `T`（呼び出し側が型を指定）。失敗時は throw（後述）。

### 2.2 base URL 解決

```ts
const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";
const resolveApiBase = () =>
  (process.env.INTERNAL_API_BASE_URL ?? "").replace(/\/$/, "")
  || FALLBACK_INTERNAL_API;
```

- 環境変数 `INTERNAL_API_BASE_URL` を末尾 `/` 除去して使用。
- 未設定時は dev fallback として `http://127.0.0.1:8787`（wrangler local）。

### 2.3 認証ヘッダ

| ヘッダ | 値 | 由来 |
| --- | --- | --- |
| `x-internal-auth` | `process.env.INTERNAL_AUTH_SECRET ?? ""` | worker-to-worker 認証 |
| `accept` | `application/json` | 固定 |
| `cookie` | Next.js `cookies().toString()` | session 維持 |
| `content-type` | `application/json`（`body` 指定時のみ） | — |

### 2.4 キャッシュ戦略

- `cache: "no-store"` を **常に** 指定（admin データは stale にしない）。
- 各 page.tsx は併せて `export const dynamic = "force-dynamic"` を宣言（Next.js segment-level）。
- `revalidate` 系 API は admin 領域では使わない。

### 2.5 エラー処理

```ts
if (!res.ok) {
  throw new Error(`admin api ${path} failed: ${res.status}`);
}
```

- 4xx / 5xx は **すべて throw**。
- Server Component から呼ばれるため、上位の `error.tsx`（`apps/web/app/(admin)/admin/error.tsx`）が捕捉する。
- detail recovery は呼び出し側でやらない（admin gate を抜けた後の失敗は基本 5xx 相当として扱う）。

---

## 3. Client-side mutation（`apps/web/src/lib/admin/api.ts`）

### 3.1 共通型

```ts
export interface AdminMutationOk<T = unknown> {
  ok: true;
  status: number;
  data: T;
}
export interface AdminMutationErr {
  ok: false;
  status: number;
  error: string;
}
export type AdminMutationResult<T = unknown> =
  | AdminMutationOk<T>
  | AdminMutationErr;
```

mutation は throw せず **discriminated union を返す**（UI が status コードで Toast 分岐するため）。

### 3.2 `call()` 内部実装

```ts
async function call<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<AdminMutationResult<T>>
```

- 同一 origin `/api/admin${path}` を fetch。
- `body !== undefined` の場合のみ `content-type: application/json` を付与し JSON 化。
- network error は `{ ok: false, status: 0, error: <message> }` として返す。
- response body が JSON のときのみ `data` をパース、それ以外は null。
- `!res.ok` のとき:
  - `data.error`（string）を優先
  - なければ `HTTP ${status}`

### 3.3 mutation 関数一覧

| 関数 | path | method | body |
| --- | --- | --- | --- |
| `patchMemberStatus(memberId, body)` | `/members/{memberId}/status` | PATCH | `{ publishState?, hiddenReason? }` |
| `postMemberNote(memberId, body)` | `/members/{memberId}/notes` | POST | `{ body: string }` |
| `patchMemberNote(memberId, noteId, body)` | `/members/{memberId}/notes/{noteId}` | PATCH | `{ body: string }` |
| `deleteMember(memberId, reason)` | `/members/{memberId}/delete` | POST | `{ reason: string }` |
| `restoreMember(memberId)` | `/members/{memberId}/restore` | POST | `{}` |
| `resolveAdminRequest(noteId, body)` | `/requests/{noteId}/resolve` | POST | `{ resolution: "approve" | "reject", resolutionNote?: string }` |
| `resolveTagQueue(queueId, body)` | `/tags/queue/{queueId}/resolve` | POST | `{ action: "confirmed", tagCodes: string[] }` or `{ action: "rejected", reason: string }` |
| `postSchemaAlias(body)` | `/schema/aliases` | POST | `{ questionId, stableKey, diffId? }` |
| `createMeeting(body)` | `/meetings` | POST | `{ title, heldOn, note? }` |
| `addAttendance(sessionId, memberId)` | `/meetings/{sessionId}/attendance` | POST | `{ memberId }` |
| `removeAttendance(sessionId, memberId)` | `/meetings/{sessionId}/attendance/{memberId}` | DELETE | — |

すべてのパスは proxy 内で `/admin/` を前置されるため、ここでは `/admin` を **書かない**。

UT-07A-02 以降、`resolveTagQueue` の body 型は `@ubm-hyogo/shared` の `TagQueueResolveBody` を参照する。client 側に同型 union を手書き複製しない。

04b-followup-004 以降、`/admin/requests` page は Server Component で `fetchAdmin("/admin/requests?status=pending&type=...")` を呼び、Client Component `RequestQueuePanel` が `resolveAdminRequest()` を通じて `/api/admin/requests/:noteId/resolve` に mutation する。`nextCursor` がある場合は `cursor` query 付きで次ページへ遷移する。409 は「他の管理者が既に処理済み」として toast + `router.refresh()` に分岐し、delete/visibility approve は confirmation modal で二段確認する。

### 3.4 不変条件（api.ts）

- 不変条件 #11: profile 本文（businessOverview 等）の編集 mutation は **意図的に存在させない**。
- 不変条件 #13: tag 直接更新 mutation も存在させない（`resolveTagQueue` のみ）。
- 不変条件 #5: 本ファイル経由 **以外**の admin mutation 経路を作らない。

---

## 4. BFF proxy（`apps/web/app/api/admin/[...path]/route.ts`）

### 4.1 役割

1. 同一 origin から呼べる Next.js Route Handler を提供（client 側の cookie/CSRF 一貫性を保つ）。
2. session.isAdmin を **再検証**（admin gate の二重化）。
3. apps/api への upstream 呼び出しに `x-internal-auth` を付与。

### 4.2 admin 再検証

```ts
async function requireAdmin(): Promise<Response | null> {
  const session = await auth();
  const u = session?.user as { isAdmin?: boolean; memberId?: string } | undefined;
  if (!u || u.isAdmin !== true) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
```

- `auth()` は Auth.js v5。
- `isAdmin !== true` で 403。401（未ログイン）には絞らず常に 403 として返す（admin endpoint ガードの簡素化）。

### 4.3 upstream へのヘッダ伝搬

| ヘッダ | 動作 |
| --- | --- |
| `x-internal-auth` | `INTERNAL_AUTH_SECRET` を付与（必須） |
| `cookie` | request の cookie をそのまま転送 |
| `authorization` | あれば転送 |
| `content-type` | あれば転送 |

### 4.4 body 処理

```ts
if (req.method !== "GET" && req.method !== "DELETE") {
  init.body = await req.text();
}
```

- body 透過。再パースしない（apps/api 側で zod 検証）。

### 4.5 response 透過

- upstream response の text + status をそのまま返却。
- `content-type` は upstream の値（なければ `application/json`）。

### 4.6 対応メソッド

`GET` / `POST` / `PATCH` / `DELETE` を export。`PUT` / `OPTIONS` は提供しない。

---

## 5. ステータスコード処理方針

### 5.1 Server fetch（`fetchAdmin`）

| status | 挙動 |
| --- | --- |
| 2xx | `T` を返す |
| 401 / 403 | throw → `error.tsx` 経由で表示。実運用上は `(admin)/layout.tsx` でブロック済みのため到達は稀 |
| 404 | throw（`not-found.tsx` ではなく `error.tsx` が拾う。明示的 not-found 分岐は現状なし） |
| 5xx | throw |

### 5.2 Client mutation（`api.ts` + UI）

| status | 一般方針 | 具体例 |
| --- | --- | --- |
| 200 / 201 / 204 | `ok: true` を返す | drawer / panel が `router.refresh()` |
| 400 / 422 | `ok: false`、UI が文脈別 Toast | MeetingPanel: 422 → "削除済み会員は登録できません" |
| 401 | `ok: false`、再ログイン誘導は呼び出し側責務 | 現状は generic Toast |
| 403 | `ok: false`、admin gate 後は基本的に発生しない | proxy が `forbidden` JSON で返す |
| 404 | `ok: false`、`error` 文字列を Toast | 例: 既存削除済み memberId への restore |
| 409 | `ok: false`、UI が文脈別 Toast | MeetingPanel: "この会員は既に出席登録されています" |
| 5xx | `ok: false`、generic Toast | `登録に失敗: ${error}` |
| network error | `{ ok: false, status: 0, error }` | 同上 |

### 5.3 二重防御（duplicate attendance）

- UI: select option `disabled={here.has(memberId)}` + click 時 set 検査
- API: 409（duplicate）/ 422（deleted member）を返す
- mutation 関数: `ok: false` + status を UI が分岐

---

## 6. 環境変数

| 変数 | 用途 | 利用箇所 |
| --- | --- | --- |
| `INTERNAL_API_BASE_URL` | apps/web → apps/api の base URL | `server-fetch.ts`, `route.ts` |
| `INTERNAL_AUTH_SECRET` | worker-to-worker `x-internal-auth` 値 | 同上 |
| `AUTH_SECRET` | Auth.js JWT 署名 | proxy の `auth()` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth | Auth.js |

平文 `.env` には記載しない（CLAUDE.md のシークレット運用ルールに従う）。Cloudflare Secrets / 1Password 参照のみ。

---

## 7. 不変条件サマリ（admin API client / proxy）

| ID | 内容 | 防御位置 |
| --- | --- | --- |
| #5 | apps/web から D1 直接アクセス禁止 | server-fetch.ts と api.ts のみが API 経路。proxy が upstream を `apps/api` に固定 |
| #11 | profile 本文編集 mutation を提供しない | api.ts に該当関数を**置かない** |
| #12 | 管理メモ mutation は MemberDrawer 内のみ | api.ts の `postMemberNote` / `patchMemberNote` を drawer 以外で参照しない |
| #13 | tag 直接更新なし、queue resolve のみ | api.ts に `resolveTagQueue` のみ |
| admin gate 二重 | layout + proxy で再検証 | `(admin)/layout.tsx` + `/api/admin/[...path]` の `requireAdmin()` |

---

## 8. 関連ドキュメント

- UI 側仕様: `ui-ux-admin-dashboard.md`
- admin endpoint 詳細（apps/api 側）: 既存 `api-endpoints.md` および apps/api 各 router 実装
- Phase outputs: `docs/30-workflows/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/outputs/`

---

## 9. Self-service BFF proxy（`apps/web/app/api/me/[...path]/route.ts`）

admin BFF proxy（§4）と並列に、会員自身のセルフサービス操作のための proxy を `apps/web/app/api/me/[...path]/route.ts` として配置する。不変条件 #5 の遵守経路をクライアント側にも一意化するための正本。

### 9.1 役割

1. ブラウザ Client Component から同一 origin で apps/api `/me/*` を呼べる経路を提供する。
2. memberId は **path に出さない**。Auth.js session を proxy 内で resolve し、apps/api 側へ session cookie / `x-internal-auth` を伝搬して memberId は backend で確定する。
3. 直接 D1 アクセス禁止（不変条件 #5）の運用形式として admin proxy と同型を維持する。

### 9.2 admin proxy との差分

| 項目 | admin proxy | self-service proxy |
| --- | --- | --- |
| 進入時ガード | `session.user.isAdmin === true` 必須 | 認証済みユーザであること（active session）。admin 判定はしない |
| path | `/api/admin/[...path]` → apps/api `/admin/*` | `/api/me/[...path]` → apps/api `/me/*` |
| memberId | path に含めて良い（admin が任意の会員を操作） | **path に含めない**。backend session resolver が確定 |
| body 透過 | text 透過、apps/api 側 zod 検証 | 同左 |

### 9.3 client helper

self-service mutation の client helper は `apps/web/src/lib/api/me-requests-client.ts` に集約する。`/api/me/*` を fetch し、エラーは `SelfRequestError` に正規化する（→ `error-handling-core.md` の self-service クライアント側統一エラー型節を参照）。

---

Last reviewed: 2026-05-02 / source: 06b-A-me-api-authjs-session-resolver, 06b-B profile self-service request UI
