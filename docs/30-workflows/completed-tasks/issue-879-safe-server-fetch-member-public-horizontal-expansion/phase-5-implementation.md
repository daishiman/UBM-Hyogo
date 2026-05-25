# Phase 5: 実装手順

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 5 / 13 |
| implementation_mode | new |

## 実装ステップ

### S-1: 共通 helper 新設

ファイル: `apps/web/src/lib/server-fetch/safe-fetch.ts`（新規）

```ts
// task: issue-879 safeServerFetch 共通 SSOT
// admin / public / member 各 layer の server component fetch を SafeResult に正規化する。
// page-fatal な error（auth gate / notFound）は rethrowOn で明示的に re-throw する。

import type { SafeResult, SafeResultError } from "../result";

const FAIL_REGEX = /(\S+) failed: (\d+)/;

export interface SafeServerFetchOptions {
  readonly codePrefix?: string;
  readonly rethrowOn?: ReadonlyArray<new (...args: never[]) => Error>;
}

function normalizeError(err: unknown, prefix: string): SafeResultError {
  if (err instanceof Error) {
    const m = err.message.match(FAIL_REGEX);
    if (m) return { code: `${prefix}_${m[2]}`, message: err.message };
    return { code: `${prefix}_FAILED`, message: err.message };
  }
  return { code: `${prefix}_UNKNOWN`, message: String(err) };
}

export async function safeServerFetch<T>(
  thunk: () => Promise<T>,
  opts: SafeServerFetchOptions = {},
): Promise<SafeResult<T>> {
  const prefix = opts.codePrefix ?? "SERVER_FETCH";
  try {
    const data = await thunk();
    return { ok: true, data };
  } catch (err) {
    if (opts.rethrowOn?.some((Cls) => err instanceof Cls)) throw err;
    return { ok: false, error: normalizeError(err, prefix) };
  }
}
```

### S-2: admin re-export 化

ファイル: `apps/web/src/lib/admin/safe-server-fetch.ts`（既存差し替え）

```ts
import { fetchAdmin, type AdminFetchOptions } from "./server-fetch";
import { safeServerFetch as common } from "../server-fetch/safe-fetch";
import type { SafeResult } from "../result";

export async function safeServerFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<SafeResult<T>> {
  return common<T>(() => fetchAdmin<T>(path, opts), { codePrefix: "ADMIN_FETCH" });
}
```

> 既存 admin spec の error code 文字列（`ADMIN_FETCH_401` 等）を維持。`apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` は無修正で通る想定。

### S-3: public SectionError

ファイル: `apps/web/src/components/public/SectionError.tsx`（新規）

```tsx
export interface SectionErrorProps {
  readonly title?: string;
  readonly detail?: string;
  readonly retryHref?: string;
}

export function SectionError({
  title = "読み込みに失敗しました",
  detail,
  retryHref,
}: SectionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="ubm-section-error ubm-section-error--public"
    >
      <p className="ubm-section-error__title">{title}</p>
      {detail ? <p className="ubm-section-error__detail">{detail}</p> : null}
      {retryHref ? (
        <a className="ubm-section-error__retry" href={retryHref}>
          再読み込み
        </a>
      ) : null}
    </div>
  );
}
```

`ubm-section-error*` クラスは `apps/web/src/styles/components/section-error.css`（既存 admin 用がある場合は同居・無ければ新設）にて `var(--ubm-color-surface-warning)` 等の既存 token で組み立てる。**HEX 直書き禁止**。

### S-4: member SectionError

ファイル: `apps/web/src/components/member/SectionError.tsx`（新規）

S-3 と同 props shape。className modifier を `ubm-section-error--member` に変える。

### S-5: `/profile` 置換

ファイル: `apps/web/app/profile/page.tsx`（既存変更）

- `Promise.all([fetchAuthed("/me"), fetchAuthed("/me/profile")])` を解体
- `session = await fetchAuthed("/me")` は素のまま（AuthRequiredError は redirect("/login") へ）
- `profile` 取得を `safeServerFetch(() => fetchAuthed<...>("/me/profile"), { codePrefix: "MEMBER_FETCH", rethrowOn: [AuthRequiredError] })` に置換
- profile 失敗時は `<SectionError detail={profileResult.error.message} />` で degrade
- existing `try/catch` block を除去（or 範囲を狭め session 取得のみに限定）

### S-6: `/(public)/members` 置換

ファイル: `apps/web/app/(public)/members/page.tsx`（既存変更）

- `const list = await listMembers(search, ...)` を `safeServerFetch(() => listMembers(search, ...), { codePrefix: "PUBLIC_FETCH" })` に置換
- 失敗時は `<SectionError detail={result.error.message} />` を `<MemberGrid>` 位置に描画
- DensityToggle / MemberFilters 等のフィルタ UI は維持（fetch 失敗でも描画継続）

### S-7: `/(public)/members/[id]` 置換

ファイル: `apps/web/app/(public)/members/[id]/page.tsx`（既存変更）

```tsx
async function fetchProfile(id: string): Promise<{ ok: true; data: PublicMemberProfile } | { ok: false; error: SafeResultError } | null> {
  try {
    const result = await safeServerFetch<unknown>(
      () => fetchPublicOrNotFound<unknown>(`/public/members/${encodeURIComponent(id)}`, { revalidate: 0 }),
      { codePrefix: "PUBLIC_FETCH", rethrowOn: [FetchPublicNotFoundError] },
    );
    if (!result.ok) return result;
    const parsed = PublicMemberProfileZ.safeParse(result.data);
    if (!parsed.success) throw new Error("zod parse failed"); // error.tsx へ
    return { ok: true, data: parsed.data };
  } catch (e) {
    if (e instanceof FetchPublicNotFoundError) return null; // notFound()
    throw e;
  }
}
```

呼び出し側で `null → notFound()`、`{ ok: false }` → `<SectionError>`、`{ ok: true }` → `<MemberDetail>`。

### S-8: spec の追加・更新

Phase 4 の test 計画に従って `.spec.tsx` を追加・更新する。

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --dir apps/web exec vitest run src/lib/server-fetch
mise exec -- pnpm --dir apps/web exec vitest run src/components/public/__tests__/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run src/components/member/__tests__/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/profile/page.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(public)/members/page.spec.tsx"
mise exec -- pnpm --dir apps/web exec vitest run "app/(public)/members/[id]/page.spec.tsx"
```

## DoD（Definition of Done）

- S-1〜S-8 完了
- 全検証コマンドが green
- AC-1〜AC-8 が満たされている
- `git grep "bg-\\[#" apps/web/src/components/{public,member}` が 0 件
- `git grep "from \"@/lib/admin/safe-server-fetch\"" apps/web` の件数が**変化していない**（admin 既存 import 不変）

## 成果物

- 本ファイル

## 完了条件

- 全ステップが実行可能な粒度で記述されている
- DoD と検証コマンドが揃っている
