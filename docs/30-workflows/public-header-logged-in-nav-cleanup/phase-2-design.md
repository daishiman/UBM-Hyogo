# Phase 2 — Design（横断版）

## 1. 共通アーキテクチャ

### 1.1 共通契約（全 header 適用）

すべてのヘッダ（PublicHeader / MemberHeader / AdminSidebar）は次の **3 共通要素**を満たす:

1. `data-auth-state="guest|member|admin"` をルート DOM 要素に付与
2. `SignOutButton` (既存 client island) を member/admin 状態のみで描画
3. session 取得は **layout 側で 1 回**、各 header に props で配信する（**重複呼出回避**）

### 1.2 共有型 / 純関数（新規）

```ts
// apps/web/src/lib/auth-view/types.ts
export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | {
      readonly kind: "admin";
      readonly profileHref: "/profile";
      readonly adminHref: "/admin";
    };
```

```ts
// apps/web/src/lib/auth-view/resolveAuthView.ts
import type { AuthView } from "./types";
export interface SessionLike {
  readonly user?: {
    readonly memberId?: string | null;
    readonly isAdmin?: boolean | null;
  } | null;
}
export function resolveAuthView(s: SessionLike | null | undefined): AuthView { /* ... */ }
```

```ts
// apps/web/src/lib/auth-view/getAuthView.ts
import { getAuth } from "../auth";
import { resolveAuthView } from "./resolveAuthView";
import type { AuthView } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    const { auth } = await getAuth();
    return resolveAuthView((await auth()) as any);
  } catch {
    return { kind: "guest" };
  }
}
```

これにより `PublicHeader` / `MemberHeader` の両方が同じ source を使う。

## 2. 画面別適用設計

### 2.1 `(public)/layout.tsx`

```tsx
export default async function PublicLayout({ children }) {
  const authView = await getAuthView();
  return (
    <div ...>
      <header data-shell="topbar">
        <PublicHeader authView={authView} />
      </header>
      <main>{children}</main>
      <footer><PublicFooter /></footer>
    </div>
  );
}
```

### 2.2 Root `/` (`app/page.tsx`)

Root page も `<PublicHeader />` を直接 mount しているため、async 化に追随する。**ただし**、Root page を `(public)` group に移動する方針 (案 X) と、`page.tsx` 内で `await getAuthView()` を呼ぶ方針 (案 Y) がある。

| 案 | 内容 | 採否 |
|----|------|------|
| X | `app/page.tsx` を `app/(public)/page.tsx` に移動し、`(public)/layout.tsx` の共通シェルを利用 | 不採用（route 変更 / SEO 影響 / 既存 metadata 再構築リスク） |
| Y | `app/page.tsx` 内で `await getAuthView()` し `<PublicHeader authView={...} />` を渡す | **採用**（最小差分） |

### 2.3 `/privacy`, `/terms`

現状 layout 経由でも `<PublicHeader />` をマウントしていない。以下のどちらか:

| 案 | 内容 | 採否 |
|----|------|------|
| X | これらを `(public)` group に移動 | 不採用（URL 不変だが route 配置変更で副作用大） |
| Y | 各 `page.tsx` 内で `<PublicHeader authView={...} />` + `<PublicFooter />` を直接描画 | **採用**（root と同じ流儀。最小差分） |

### 2.4 `/login`

- 先頭で `await getSession()` を呼ぶ
- session が non-null かつ `memberId` 非空なら `redirect(safeNext(searchParams.next) ?? "/profile")`
- `safeNext` は `/` 始まり・`//` で始まらない・`http(s)://` を含まないパスのみ通す純関数（新規 `apps/web/src/lib/url/safe-next.ts`）

### 2.5 `MemberHeader`

```tsx
export interface MemberHeaderProps { readonly authView?: AuthView }
export function MemberHeader({ authView }: MemberHeaderProps = {}) {
  return (
    <header data-testid="member-header" data-auth-state={authView?.kind ?? "member"}>
      <span className="brand">UBM 兵庫</span>
      <nav aria-label="member navigation">
        <a href="/profile">マイページ</a>
        <a href="/members">公開ページ</a>
        {authView?.kind === "admin" && (
          <a href="/admin" data-role="admin-cta" aria-label="管理ダッシュボードへ移動">管理</a>
        )}
      </nav>
      <SignOutButton />
    </header>
  );
}
```

`(member)/layout.tsx` を async 化して `await getAuthView()` 取得 → props で渡す。

### 2.6 `AdminSidebar`

既存 nav の最下段に「公開サイトに戻る」リンクを追加:

```tsx
<a href="/" data-role="public-return" aria-label="公開サイトに戻る">
  公開サイトに戻る
</a>
```

既存 props (`schemaDiffCount` / `userDisplayName` / `userEmail`) は変更しない。

### 2.7 e2e (Task G)

`apps/web/playwright/tests/auth-slot-coverage.spec.ts`（新規）。

- `storageState` を 3 種（guest = 未認証, member = `playwright/.auth/member.json`, admin = `playwright/.auth/admin.json`）切替
- 各 storageState で 7 routes (`/`, `/members`, `/register`, `/privacy`, `/terms`, `/profile`, `/admin`) を踏み、`data-auth-state` 属性が期待値であることを assert

既存 fixture 不在の storageState は **既存 `apps/web/playwright/fixtures/auth.ts`** から流用または生成。詳細は Task G で確定。

## 3. session 取得の重複回避

- public/member/admin それぞれの layout で **1 回だけ** `getAuthView()` / `getSession()` を呼ぶ
- React の cache (Next.js 標準) は使わない（layout 単位の呼出回数で十分）
- Root `/` および `/privacy` `/terms` は layout 経由しないため、各 page.tsx 内で 1 回呼ぶ

## 4. SignOutButton 再利用

既存 `apps/web/src/components/auth/SignOutButton.tsx` をそのまま使う。Server から子として埋め込む形は Next.js App Router 標準。

## 5. データフロー図

```
  [layout / page]
        │
        ▼
   getAuthView()  ──→ getAuth().auth() ──→ Auth.js JWT decode
        │                        │
        │                        └─→ failure → AuthView = guest
        ▼
   AuthView (guest/member/admin)
        │
        ├── PublicHeader  (data-auth-state, AuthSlot)
        ├── MemberHeader  (admin-cta only when admin)
        └── AdminSidebar  (public-return link 常時表示)
```
