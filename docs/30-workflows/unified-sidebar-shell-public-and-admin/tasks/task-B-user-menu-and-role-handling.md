# Task B — SidebarUserMenu（左下ロール対応アバター + プロフィール / 編集申請 / ログアウト）

[実装区分: 実装仕様書]

## 目的

サイドバー左下のユーザーアイコンから、ロール別 action 集合を popover で集約する。
「管理者」「会員」「公開閲覧者」を明確に使い分け、ログアウト / プロフィール参照 / 編集申請をここに統合する。

## 変更対象ファイル

### 新規

- `apps/web/src/components/shell/SidebarUserMenu.tsx` (Client)
- `apps/web/src/components/shell/SidebarUserAvatar.tsx` (Client; initials + admin badge)
- `apps/web/src/components/shell/user-menu-config.ts` (純関数: ロール → menu items)
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`
- `apps/web/src/components/shell/__tests__/user-menu-config.spec.ts`

## シグネチャ

```ts
// user-menu-config.ts
import type { ShellRole } from './shell-config'

export type UserMenuAction =
  | { kind: 'link'; id: string; label: string; href: string }
  | { kind: 'signout'; id: 'signout'; label: 'ログアウト' }
  | { kind: 'login'; id: 'login'; label: 'ログイン'; href: '/login' }

export function buildUserMenuActions(role: ShellRole): UserMenuAction[]
// viewer: [{login,'/login'}]
// member: [{link,'profile','プロフィール','/profile'},
//          {link,'edit-request','プロフィール編集申請','/profile#edit-request'},
//          {signout}]
// admin:  [{link,'profile','プロフィール','/profile'},
//          {link,'edit-request','プロフィール編集申請','/profile#edit-request'},
//          {link,'admin-dashboard','管理者ダッシュボード','/admin'},
//          {signout}]
```

```tsx
// SidebarUserMenu.tsx
export type SidebarUserMenuProps = {
  role: ShellRole
  user: { displayName: string; email: string; initials: string } | null
  collapsed: boolean
}
export function SidebarUserMenu(props: SidebarUserMenuProps): JSX.Element
```

```tsx
// SidebarUserAvatar.tsx
export function SidebarUserAvatar(props: {
  initials: string
  role: ShellRole
  size?: 'sm' | 'md'
}): JSX.Element
// admin の場合のみ data-role="admin" + 右下 admin badge dot を表示
```

## 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | role, user（server から渡る Plain Object） |
| 出力 | popover 開閉、各 action は `<Link>` または既存 `SignOutButton` |
| 副作用 | popover の open/close 内部 state のみ。`SignOutButton` 経由でのみ `signOut()` 実行 |

## ロール表記の一貫性

- 画面表示: 「管理者」「会員」「ゲスト」のみを使う
- コード識別子: `'admin' | 'member' | 'viewer'`
- popover ヘッダに `{displayName}` の下に小さく `'管理者' | '会員'` ラベルを出す（viewer は省略）

## popover 実装方針

- 新規 popover primitive は作らず、`<details>` ベースで実装（CSS-only fallback）
- a11y: `<details>` の `<summary>` を `role="button" aria-haspopup="menu"`
- collapsed 時はアバターのみ表示、popover は右側（lg/md）/ 上方向（drawer 内）に展開
- route 変更時に自動 close: `useEffect` で `usePathname` を watch して `details.open = false`

## SignOutButton 再利用

- 既存 `apps/web/src/components/auth/SignOutButton.tsx` を **embed**（再 export しない）
- `<SignOutButton variant="menu-item" />` 相当の見た目に整える（必要なら既存に variant prop 追加・本仕様の範囲内）

## テスト

| ファイル | ケース |
|---------|------|
| `user-menu-config.spec.ts` | 3 ロールで action 集合が期待値（順序込み） |
| `SidebarUserMenu.spec.tsx` | viewer: 「ログイン」のみ表示 / member: signout + 2 link / admin: signout + 3 link / collapsed=true で label が `sr-only` |

## ローカル実行

```bash
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/SidebarUserMenu
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/user-menu-config
```

## DoD

1. spec green
2. 3 ロールの popover snapshot が一致
3. `SignOutButton` の挙動（`signOut({ redirectTo: '/login' })`）は不変
4. `SidebarShellServer` が role 判定後に直接描画できる
