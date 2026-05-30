# Phase 8: リファクタ

## リファクタ方針

- role → action 決定ロジックは `user-menu-config.ts` のみに集約し、`SidebarUserMenu.tsx` 側で分岐を増やさない。
- `SignOutButton` の `variant` prop は default unchanged、menu-item は class set 切替のみで挙動不変。
- avatar の admin 判定は `SidebarUserAvatar.tsx` のみに閉じ、`SidebarUserMenu.tsx` から admin 専用 className を直接付与しない。
- popover の open/close 副作用は `useEffect(usePathname)` 1 箇所に集約し、各 menuitem の `onClick` で個別 close しない。

## grep gates

```bash
git grep -n "isAdmin\\|role === 'admin'" -- apps/web/src/components/shell
git grep -n "signOut(" -- apps/web/src/components/shell
git grep -n "details.open" -- apps/web/src/components/shell
```

- `isAdmin` / `role === 'admin'` 判定は `SidebarUserAvatar.tsx` と `user-menu-config.ts` の 2 箇所のみに留める。
- `signOut(` 直接呼び出しは shell 配下 0 件（必ず `SignOutButton` 経由）。
- `details.open` 書込みは `SidebarUserMenu.tsx` の `useEffect` 1 箇所のみ。

## 完了条件

責務分離が維持され、role 分岐・signOut 直呼び・popover state 書込みの局所性が grep で証明される。
