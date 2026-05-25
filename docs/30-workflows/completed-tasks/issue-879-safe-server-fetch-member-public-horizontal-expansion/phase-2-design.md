# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 2 / 13 |
| 採用方針 | Option B（共通 lib への昇格＋admin re-export 維持） |

## 1. アーキテクチャ概要

```
                       apps/web/src/lib/result.ts
                       (SafeResult<T> / SafeResultError — layer 中立・据え置き)
                                 ▲
                                 │ import { SafeResult, SafeResultError }
                                 │
                  apps/web/src/lib/server-fetch/safe-fetch.ts  ← 新規（共通 SSOT）
                  export safeServerFetch<T>(thunk, opts?): Promise<SafeResult<T>>
                                 ▲
                ┌────────────────┼─────────────────┬─────────────────┐
                │                │                 │                 │
   admin/safe-server-fetch.ts  /profile/page.tsx  (public)/members  (public)/members/[id]
   (re-export 層・既存)         (fetchAuthed wrap)  (listMembers wrap) (fetchPublicOrNotFound wrap)
```

## 2. 共通 helper シグネチャ

```ts
// apps/web/src/lib/server-fetch/safe-fetch.ts
import type { SafeResult, SafeResultError } from "../result";

export interface SafeServerFetchOptions {
  /** error.code prefix（layer 識別）。default: "SERVER_FETCH" */
  readonly codePrefix?: string;
  /** これらの error は握り潰さず re-throw（auth gate / framework signal の保護） */
  readonly rethrowOn?: ReadonlyArray<new (...args: unknown[]) => Error>;
}

export async function safeServerFetch<T>(
  thunk: () => Promise<T>,
  opts?: SafeServerFetchOptions,
): Promise<SafeResult<T>>;
```

### 動作仕様

| 入力 | 出力 |
|---|---|
| thunk が resolve | `{ ok: true, data }` |
| thunk が throw（任意 Error） | `{ ok: false, error: { code: `${prefix}_FAILED`, message } }` |
| thunk が throw（status 含む既知 message `… failed: NNN`） | `{ ok: false, error: { code: `${prefix}_NNN`, message } }` |
| thunk が throw（`rethrowOn` に含まれる class） | **re-throw**（呼び出し側 / error.tsx へ伝播） |
| thunk が throw（Next.js redirect / notFound のような特殊 signal） | re-throw（detect 不要・rethrowOn で明示） |

### 副作用

- なし（純関数）。logger は呼ばない。呼び出し側が `result.ok === false` 時に logger を叩く方針に揃える（admin と同じ）。

## 3. admin re-export 層

```ts
// apps/web/src/lib/admin/safe-server-fetch.ts（既存ファイルを内部だけ書き換え）
import { fetchAdmin, type AdminFetchOptions } from "./server-fetch";
import { safeServerFetch as commonSafeServerFetch } from "../server-fetch/safe-fetch";
import type { SafeResult } from "../result";

export async function safeServerFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<SafeResult<T>> {
  return commonSafeServerFetch<T>(() => fetchAdmin<T>(path, opts), {
    codePrefix: "ADMIN_FETCH",
  });
}
```

- 既存呼び出し（`safeServerFetch(path, opts)`）の signature と error code prefix（`ADMIN_FETCH_*`）を完全に維持する。

## 4. SectionError UI 設計

### public / member 共通 props shape

```ts
export interface SectionErrorProps {
  readonly title?: string;        // 既定: "読み込みに失敗しました"
  readonly detail?: string;       // SafeResultError.message
  readonly retryHref?: string;    // 再試行リンク（任意）
  readonly className?: string;    // layer-specific layout extension
}
```

`AdminSectionError` は既存 admin call site 互換のため `sectionLabel` / `code` / `correlationId` / `message` API を維持する。public / member は props shape を相互に完全一致させ、admin とは role / aria / SafeResult diagnostics の設計パターンを揃える。

### Layer 別実装

| ファイル | theme | 既定 title |
|---|---|---|
| `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（既存） | admin cool | 既存 API 維持 |
| `apps/web/src/components/public/SectionError.tsx`（新規） | public default | 「読み込みに失敗しました」 |
| `apps/web/src/components/member/SectionError.tsx`（新規） | member warm | 「読み込みに失敗しました」 |

### token 参照

- 背景: `var(--ubm-color-surface-elevated)` または `var(--ubm-color-surface-warning)` 系（既存 token のみ）
- テキスト: `var(--ubm-color-text-warning)` 系
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 対応）

### a11y

- `role="alert"`
- `aria-live="polite"`
- retryHref 描画時のみ `<a>` を表示

## 5. page 置換方針

### `/profile`

```tsx
// session 取得は素 throw を維持（auth gate）
const session = await fetchAuthed<MeSessionResponse>("/me");
if (!session) redirect("/login");

// profile 取得のみ safeServerFetch
const profileResult = await safeServerFetch<MeProfileResponse>(
  () => fetchAuthed<MeProfileResponse>("/me/profile"),
  { codePrefix: "MEMBER_FETCH", rethrowOn: [AuthRequiredError] },
);

return (
  <>
    <MemberHeader ... />
    {profileResult.ok
      ? <ProfileSections data={profileResult.data} session={session} />
      : <SectionError detail={profileResult.error.message} />}
  </>
);
```

### `/(public)/members`

```tsx
const listResult = await safeServerFetch(
  () => listMembers(search, { revalidate: PUBLIC_API_REVALIDATE }),
  { codePrefix: "PUBLIC_FETCH" },
);

return (
  <>
    <PublicHeader />
    {listResult.ok
      ? <MemberGrid data={listResult.data} />
      : <SectionError detail={listResult.error.message} />}
  </>
);
```

### `/(public)/members/[id]`

```tsx
const result = await safeServerFetch<unknown>(
  () => fetchPublicOrNotFound<unknown>(`/public/members/${encodeURIComponent(id)}`, { revalidate: 0 }),
  { codePrefix: "PUBLIC_FETCH", rethrowOn: [FetchPublicNotFoundError] },
);
// FetchPublicNotFoundError は外側で catch → notFound()
```

> `FetchPublicNotFoundError` は **re-throw allowlist** に入れ、外側で `notFound()` に変換する。これにより SafeResult を貫きつつ 404 経路（既存 UX）を保持する。

## 6. import path

| Layer | import |
|---|---|
| 共通 | `import { safeServerFetch } from "@/lib/server-fetch/safe-fetch";` |
| admin | `import { safeServerFetch } from "@/lib/admin/safe-server-fetch";`（既存・unchanged） |
| public | `import { SectionError } from "@/components/public/SectionError";` |
| member | `import { SectionError } from "@/components/member/SectionError";` |

## 成果物

- 本ファイル

## 完了条件

- 全 AC をカバーする設計が確定している
- admin 既存 import path / error code prefix が破壊されないことが設計上保証されている
- `FetchPublicNotFoundError` / `AuthRequiredError` 等の特殊 error の取り扱い方針が確定している
