# Phase 2 — 設計

## 1. アーキテクチャ概要

```
(public)/layout.tsx (async server)
  └─ await getAuthView()  ─► apps/web/src/lib/auth-view/getAuthView.ts
                                 └─ getAuth().auth()  (Auth.js)
                                       │ catch → guest
                                       ▼
                                 resolveAuthView(session)  (pure)
                                       │
                                       ▼
                                 AuthView (discriminated union)
                                       │
                                       ▼
  └─ <PublicHeader authView={authView} />  (async server component)
       └─ AuthSlot render branch by authView.kind
```

## 2. モジュール責務分解

| モジュール | 責務 | 種別 |
|-----------|------|------|
| `types.ts` | `AuthView` discriminated union 定義 + `SessionLike` 型 | 型定義のみ |
| `resolveAuthView.ts` | session → AuthView の純関数。副作用なし | pure function |
| `getAuthView.ts` | `getAuth().auth()` 呼出 + 例外吸収 + `resolveAuthView` 委譲 | async server-side helper |
| `index.ts` | named re-export barrel | barrel |
| `PublicHeader.tsx` | async render。`authView` prop 受け取り。省略時は `getAuthView()` を呼ぶ fallback | server component |
| `(public)/layout.tsx` | `getAuthView()` を呼び `PublicHeader` に props 注入 | server layout |

## 3. 型定義

```ts
// types.ts
export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | { readonly kind: "admin"; readonly profileHref: "/profile"; readonly adminHref: "/admin" };

export interface SessionLike {
  readonly user?: {
    readonly memberId?: string | null;
    readonly isAdmin?: boolean | null;
  } | null;
}
```

## 4. 関数シグネチャ

```ts
// resolveAuthView.ts
export function resolveAuthView(session: SessionLike | null | undefined): AuthView;
```

判定ロジック:
1. `session?.user?.memberId` が空文字 / `null` / `undefined` → `{ kind: "guest" }`
2. `memberId` 有 + `isAdmin === true` → `{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }`
3. `memberId` 有 + `isAdmin` falsy → `{ kind: "member", profileHref: "/profile" }`

```ts
// getAuthView.ts
export async function getAuthView(): Promise<AuthView>;
```

実装方針: `try { const session = await getAuth().auth(); return resolveAuthView(session); } catch { return { kind: "guest" }; }`（invariant #11 fail-closed）

```tsx
// PublicHeader.tsx
export interface PublicHeaderProps {
  readonly currentPath?: string;
  readonly authView?: AuthView;
}
export async function PublicHeader(props?: PublicHeaderProps): Promise<JSX.Element>;
```

## 5. AuthSlot 描画契約

```tsx
// guest
<a href="/login" data-role="auth-cta" aria-label="ログイン">ログイン</a>

// member
<div data-role="member-actions">
  <a href="/profile" data-role="member-cta" aria-label="マイページへ移動">マイページ</a>
  <SignOutButton redirectTo="/" label="ログアウト" />
</div>

// admin
<div data-role="member-actions">
  <a href="/profile" data-role="member-cta" aria-label="マイページへ移動">マイページ</a>
  <a href="/admin" data-role="admin-cta" aria-label="管理ダッシュボードへ移動">管理</a>
  <SignOutButton redirectTo="/" label="ログアウト" />
</div>
```

`<header data-auth-state={authView.kind}>` 必須（テスト対象の anchor）。

## 6. layout 配線

```tsx
// apps/web/app/(public)/layout.tsx
import { getAuthView } from "@/src/lib/auth-view";
import { PublicHeader } from "@/src/components/public/PublicHeader";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const authView = await getAuthView();
  return (
    <div data-theme="warm" data-route-group="public" data-testid="public-shell">
      <header data-shell="topbar">
        <PublicHeader authView={authView} />
      </header>
      <main data-route="public">{children}</main>
      <footer data-shell="footer"><PublicFooter /></footer>
    </div>
  );
}
```

## 7. 既存コンポーネント再利用（FB-SDK-07-1）

- `SignOutButton` は既存（親 workflow Phase 5 spec で member/admin 動線として参照済）。新規実装しない。
- `PublicHeader` 内 brand / nav 3 link / `aria-current` 既存実装は保持。

## 8. エラー・エッジケース

| ケース | 振る舞い |
|--------|---------|
| `getAuth().auth()` throw | catch → guest |
| session = null | guest |
| session.user = null | guest |
| memberId = "" | guest |
| isAdmin = null | member（admin 扱いしない） |

## 9. 命名衝突検査（FB-04）

- `apps/web/src/lib/` 配下に `auth-view/` ディレクトリ無し（新規）— 衝突なし。
- `AuthView` 型名は `apps/web/src` 全域で未使用（要 grep 確認: `rg "type AuthView\b" apps/web/src` で 0 hit を Phase 5 着手前に確認）。

## 10. props vs internal state（VSCPKR-03）

- `authView`: **external prop**（layout から注入）。
- `currentPath`: external prop（既存）。
- 内部 state なし（server component）。
