# Task E — MemberHeader に admin リンク + session 配線

**[実装区分: 実装仕様書]**

## 1. 目的

`(member)/profile` ページの `MemberHeader` は現状 SignOut / マイページ / 公開ページの 3 リンクを持つが、管理者ユーザーでも「管理」リンクが無く、`/admin` への動線が公開層からも会員層からも消失している。`AuthView` を受領して admin 状態のときのみ admin リンクを表示する。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/components/layout/MemberHeader.tsx` | 編集 |
| 2 | `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 新規 or 編集 |
| 3 | `apps/web/app/(member)/layout.tsx` | 編集（async + authView 配信） |

## 3. MemberHeader 編集後シグネチャ

```tsx
import { SignOutButton } from "../auth/SignOutButton";
import type { AuthView } from "../../lib/auth-view";

export interface MemberHeaderProps {
  readonly authView?: AuthView;
}

export function MemberHeader({ authView }: MemberHeaderProps = {}) {
  const isAdmin = authView?.kind === "admin";
  return (
    <header
      className="member-header"
      data-testid="member-header"
      data-auth-state={authView?.kind ?? "member"}
    >
      <span className="brand" aria-label="UBM 兵庫">UBM 兵庫</span>
      <nav aria-label="member navigation">
        <a href="/profile">マイページ</a>
        <a href="/members">公開ページ</a>
        {isAdmin && (
          <a href="/admin" data-role="admin-cta" aria-label="管理ダッシュボードへ移動">
            管理
          </a>
        )}
      </nav>
      <SignOutButton />
    </header>
  );
}
```

## 4. `(member)/layout.tsx` 編集

```tsx
import { MemberHeader } from "../../src/components/layout/MemberHeader";
import { getAuthView } from "../../src/lib/auth-view";

export default async function MemberLayout({ children }) {
  const authView = await getAuthView();
  return (
    <div ... data-theme="warm" data-route-group="member" data-testid="member-shell">
      <header data-shell="topbar"><MemberHeader authView={authView} /></header>
      <main ...>{children}</main>
    </div>
  );
}
```

既存 `data-*` 属性 / className は変更しない。

## 5. テスト方針

`MemberHeader.spec.tsx`:

1. `<MemberHeader />`（authView 未指定）→ `data-auth-state="member"`、admin リンク不存在
2. `<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />` → 同上
3. `<MemberHeader authView={{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }} />` → `data-auth-state="admin"`、`data-role="admin-cta"` (`href="/admin"`) 存在
4. 全ケースで `SignOutButton` (`data-testid="sign-out-button"`) 存在
5. 全ケースで brand / マイページ / 公開ページ 3 要素存在（regression）

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/MemberHeader.spec.tsx
```

## 7. DoD

- [ ] MemberHeader が `authView` prop を受領
- [ ] admin session のみ admin リンク描画
- [ ] `(member)/layout.tsx` async + `<MemberHeader authView />`
- [ ] 既存 `data-testid="member-header"` を維持
- [ ] typecheck / lint / vitest green
- [ ] HEX 直書きなし

## 8. 依存

- **前提**: Task A の `AuthView` 型 / `getAuthView()` が公開済
- 並列: B / C / D / F と並列実装可
