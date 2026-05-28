# Task A — PublicHeader session 認識化 + AuthView 基盤

**[実装区分: 実装仕様書]**

## 1. 目的

`PublicHeader` を async server component 化し、ログイン状態に応じて auth CTA を出し分ける。後続タスク（B/C/E/G）が共有する `AuthView` 型・`resolveAuthView()` 純関数・`getAuthView()` 取得ヘルパを基盤として提供する。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/lib/auth-view/types.ts` | 新規 |
| 2 | `apps/web/src/lib/auth-view/resolveAuthView.ts` | 新規 |
| 3 | `apps/web/src/lib/auth-view/getAuthView.ts` | 新規 |
| 4 | `apps/web/src/lib/auth-view/index.ts` | 新規（barrel） |
| 5 | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 |
| 6 | `apps/web/src/components/public/PublicHeader.tsx` | 編集（async 化） |
| 7 | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 編集 |
| 8 | `apps/web/app/(public)/layout.tsx` | 編集（async + authView props 配信） |

## 3. 関数・型シグネチャ

```ts
// types.ts
export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | { readonly kind: "admin"; readonly profileHref: "/profile"; readonly adminHref: "/admin" };
```

```ts
// resolveAuthView.ts
export interface SessionLike {
  readonly user?: { readonly memberId?: string | null; readonly isAdmin?: boolean | null } | null;
}
export function resolveAuthView(session: SessionLike | null | undefined): AuthView;
```

```ts
// getAuthView.ts
export async function getAuthView(): Promise<AuthView>;
// 内部で getAuth().auth() を呼び、例外/null は { kind: "guest" } で吸収
```

```tsx
// PublicHeader.tsx
export interface PublicHeaderProps {
  readonly currentPath?: string;
  readonly authView?: AuthView; // 省略時は内部で getAuthView() 呼出（root / 静的ページ用 fallback）
}
export async function PublicHeader(props?: PublicHeaderProps): Promise<JSX.Element>;
```

## 4. AuthSlot 描画契約

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

`<header>` ルートに `data-auth-state={authView.kind}` を必ず付与。

## 5. layout 配線

```tsx
// (public)/layout.tsx
import { getAuthView } from "../../src/lib/auth-view";
export default async function PublicLayout({ children }) {
  const authView = await getAuthView();
  return (
    <div data-theme="warm" data-route-group="public" data-testid="public-shell" ...>
      <header data-shell="topbar"><PublicHeader authView={authView} /></header>
      <main data-route="public" ...>{children}</main>
      <footer data-shell="footer"><PublicFooter /></footer>
    </div>
  );
}
```

## 6. テスト方針

### `resolveAuthView.spec.ts`（4 ケース）

1. `null` → guest
2. `{ user: { memberId: "" } }` → guest
3. `{ user: { memberId: "m1" } }` → member
4. `{ user: { memberId: "m1", isAdmin: true } }` → admin

### `PublicHeader.spec.tsx`（既存 2 + 追加 4）

- 既存: brand / nav 3 件描画
- 追加 5: `authView={{kind:"guest"}}` → `data-auth-state="guest"` + `/login` リンク
- 追加 6: `authView={{kind:"member", profileHref:"/profile"}}` → `data-role="member-cta"` + `data-testid="sign-out-button"` + `/login` 不存在
- 追加 7: `authView={{kind:"admin",...}}` → `data-role="admin-cta"` (`/admin`) + member-cta 両方
- 追加 8: `currentPath="/members"` で `aria-current="page"` 付与（既存挙動の retention）

render 形:
```ts
const element = await PublicHeader({ authView: { kind: "member", profileHref: "/profile" } });
render(element);
```

## 7. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  src/components/public/__tests__/PublicHeader.spec.tsx
```

## 8. DoD

- [ ] 8 ファイル変更完了
- [ ] typecheck / lint green
- [ ] vitest 7+ ケース pass
- [ ] `(public)/layout.tsx` が async 化、`<PublicHeader authView />` で配信
- [ ] HEX 直書きなし (`rg "#[0-9a-fA-F]{6}" apps/web/src/components/public/PublicHeader.tsx` 0 hit)
- [ ] `data-auth-state` 属性が 3 値リテラルのみ
