# Phase 5: 実装手順

## 前提

- Task A（`SidebarShell` primitive / `shell-config.ts` の `ShellRole` 型）が同一 wave で先行配置されていること。未配置の場合は本 task 内で `type ShellRole = 'viewer' | 'member' | 'admin'` を一時的に localize し、Task A 完了後に `import type` へ差し替える。

## 手順

1. **`user-menu-config.ts` を新規作成**
   - `import type { ShellRole } from './shell-config'`
   - `UserMenuAction` discriminated union を export
   - `buildUserMenuActions(role)` を switch で実装。各 role の配列リテラルを return。`as const` で型を厳密化。
2. **`SidebarUserAvatar.tsx` を新規作成（`'use client'`）**
   - props: `{ initials, role, size='md' }`
   - admin 判定: `data-role={role === 'admin' ? 'admin' : undefined}` + admin 時のみ `<span data-admin-badge />` を追加
   - サイズは `size==='sm' ? 32 : 40` px を `style` または既存 token class で表現
3. **`SidebarUserMenu.tsx` を新規作成（`'use client'`）**
   - `useRef<HTMLDetailsElement>` を確保
   - `const pathname = usePathname()` を取得
   - `useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname])`
   - `const actions = buildUserMenuActions(role)`
   - `user === null` ブランチでは avatar に initials を出さず（または `?`）、`actions` の `login` のみ menu に描画
   - `<details>` / `<summary>` / `<div role="menu">` を §Phase 2 DOM 契約通りに組む
4. **`SignOutButton` に `variant` prop を追加（必要なら）**
   - `type Props = { variant?: 'default' | 'menu-item' }`、default 値 `'default'`
   - menu-item は左寄せ・block 幅・既存 menuitem の class set と統一
5. **テストを追加**
   - `__tests__/user-menu-config.spec.ts`（vitest）
   - `__tests__/SidebarUserMenu.spec.tsx`（vitest + @testing-library/react）
6. **grep gate 確認**
   - `git grep -n "buildUserMenuActions\\|SidebarUserMenu\\|SidebarUserAvatar" -- apps/web` で重複定義 0 件
   - `git grep -n "SignOutButton" -- apps/web/src/components/shell` で本 task の embed 経路のみ

## 境界

- API / D1 / Google Form schema / Auth.js middleware / npm package は変更しない
- 新規 popover library / 新規 design token は追加しない（既存 token class のみ利用）

## 完了条件

DoD（Phase 1 AC-B1..AC-B10）がすべて満たされ、Phase 9 の local gates が green。
