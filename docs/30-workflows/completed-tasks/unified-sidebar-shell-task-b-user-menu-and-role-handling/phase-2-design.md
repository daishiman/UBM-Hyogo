# Phase 2: 設計

## 設計方針

`apps/web/src/components/shell/` 配下に **pure 純関数（`user-menu-config.ts`）+ Client primitive（`SidebarUserMenu.tsx` / `SidebarUserAvatar.tsx`）** の 3 ファイル分離で実装する。role → action の決定は完全に pure function に閉じ込め、render 層は `<details>/<summary>` の DOM 構造に専念する。popover state は `<details open>` 属性 + 自前 `useEffect(usePathname)` だけで構成し、外部 popover library / 新規 primitive は導入しない。

## 変更対象ファイル

| 種別 | Path | 役割 |
| --- | --- | --- |
| 新規 | `apps/web/src/components/shell/user-menu-config.ts` | `ShellRole → UserMenuAction[]` 純関数 |
| 新規 | `apps/web/src/components/shell/SidebarUserAvatar.tsx` | initials + admin badge dot (Client) |
| 新規 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | `<details>` popover + action list (Client) |
| 新規 | `apps/web/src/components/shell/__tests__/user-menu-config.spec.ts` | pure config の 3 ロール契約 |
| 新規 | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | render / a11y / collapsed / route-close |
| 編集（任意） | `apps/web/src/components/auth/SignOutButton.tsx` | `variant?: 'default' \| 'menu-item'` prop 追加（menu-item 用見た目） |

## 型 / シグネチャ

```ts
// shell-config.ts（Task A 提供）からの再利用
import type { ShellRole } from './shell-config'; // 'viewer' | 'member' | 'admin'

// user-menu-config.ts
export type UserMenuAction =
  | { kind: 'link'; id: string; label: string; href: string }
  | { kind: 'signout'; id: 'signout'; label: 'ログアウト' }
  | { kind: 'login'; id: 'login'; label: 'ログイン'; href: '/login' };

export function buildUserMenuActions(role: ShellRole): UserMenuAction[];
```

```tsx
// SidebarUserMenu.tsx
export type SidebarUserMenuProps = {
  role: ShellRole;
  user: { displayName: string; email: string; initials: string } | null;
  collapsed: boolean;
};
export function SidebarUserMenu(props: SidebarUserMenuProps): JSX.Element;

// SidebarUserAvatar.tsx
export type SidebarUserAvatarProps = {
  initials: string;
  role: ShellRole;
  size?: 'sm' | 'md';
};
export function SidebarUserAvatar(props: SidebarUserAvatarProps): JSX.Element;
```

## action 集合（仕様確定）

| role | actions（順序付き） |
| --- | --- |
| `viewer` | `[{ kind:'login', id:'login', label:'ログイン', href:'/login' }]` |
| `member` | `link profile (/profile)` → `link edit-request (/profile#edit-request)` → `signout` |
| `admin` | `link profile (/profile)` → `link edit-request (/profile#edit-request)` → `link admin-dashboard (/admin)` → `signout` |

## DOM 契約

```html
<details data-shell-user-menu data-role={role} data-collapsed={collapsed} className="...">
  <summary role="button" aria-haspopup="menu" aria-label="ユーザーメニュー">
    <SidebarUserAvatar ... />
    {!collapsed && <span className="...">{displayName}<small>{管理者|会員|null}</small></span>}
  </summary>
  <div role="menu" className="popover ...">
    {actions.map(a => renderAction(a))}
  </div>
</details>
```

- `renderAction`:
  - `link` → `<Link href role="menuitem">{label}</Link>`
  - `signout` → `<SignOutButton variant="menu-item" />`（embed）
  - `login` → `<Link href="/login" role="menuitem">ログイン</Link>`
- `collapsed=true` 時は label を `<span className="sr-only">` 化、avatar のみ表示。
- admin の場合のみ avatar に `data-role="admin"` + 右下 badge dot。

## state / 副作用

- popover open/close: `<details open>` 属性（native）。
- route close: `useEffect(() => { ref.current.open = false; }, [pathname])`（`usePathname` from `next/navigation`）。
- `signOut` 実行は `SignOutButton` 経由のみ。本コンポーネントから直接呼ばない。

## 完了条件

Phase 1 AC-B1..AC-B10 が変更対象ファイル / 型 / DOM 契約 / state 設計に 1:1 で trace されている。
