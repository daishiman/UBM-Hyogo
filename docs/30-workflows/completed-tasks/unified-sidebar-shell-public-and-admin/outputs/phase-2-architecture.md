# Phase 2: アーキテクチャ

## コンポーネント階層

```
apps/web/src/components/shell/
├── SidebarShell.tsx          (Client, Compositional root)
├── SidebarShell.server.tsx   (Server, role 別 props 構築 + getSession)
├── SidebarBrand.tsx          (Client)
├── SidebarNav.tsx            (Client, nav group + active link)
├── SidebarNavGroup.tsx       (Client, label + items)
├── SidebarNavItem.tsx        (Client, icon + label + active state)
├── SidebarUserMenu.tsx       (Client, role-aware popover)
├── SidebarCollapseToggle.tsx (Client, lg 用トグル)
├── SidebarMobileTrigger.tsx  (Client, sm 用 hamburger)
├── SidebarDrawer.tsx         (Client, sm 用 overlay)
├── useSidebarState.ts        (Client hook, localStorage 永続化)
└── shell-config.ts           (nav 定義 / role に対する nav 投影関数)
```

旧 `apps/web/src/components/layout/AdminSidebar.tsx` および
`apps/web/src/components/public/PublicHeader*.tsx` 系は **Task D / C の最後で削除**。
中間状態で並存させない。

## Server / Client 境界

- Server: `SidebarShell.server.tsx` が `getSession()` と `getSchemaDiffCount()`（admin の場合のみ）を呼び、
  `<SidebarShellClient>` に Plain Object props を渡す
- Client: 上記以外。`useSidebarState` で collapsed / drawer-open を管理

```ts
// shell-config.ts
export type ShellRole = 'viewer' | 'member' | 'admin'
export type ShellNavItem = {
  id: string
  href: string
  label: string
  icon: 'home' | 'directory' | 'register' | 'profile'
    | 'dashboard' | 'attendance' | 'members' | 'tag-queue'
    | 'schema' | 'meeting' | 'requests' | 'identity' | 'audit'
  badge?: { tone: 'warn' | 'danger' | 'info'; count: number }
}
export type ShellNavGroup = {
  id: 'public' | 'members' | 'admin'
  label: string
  items: ShellNavItem[]
}
export function buildNavForRole(
  role: ShellRole,
  ctx: { schemaDiffCount?: number },
): ShellNavGroup[]
```

## Props 設計

```ts
// SidebarShell (Client)
type SidebarShellProps = {
  role: ShellRole
  user: { displayName: string; email: string; initials: string } | null
  navGroups: ShellNavGroup[]
  activePath: string
  mobileTriggerSlot: ReactNode
  children: ReactNode
}
```

`activePath` は `app/(public)/layout.tsx` 等で `headers().get('x-pathname')` から得る
（既存の `PublicHeaderWithPath` で確立されたパターンを踏襲）。

## 既存資産の再利用

| 既存 | 再利用方針 |
|------|----------|
| `apps/web/src/components/layout/AdminSidebar.tsx` | nav 定義のソースとして移植（Admin 9 item） → 旧ファイル削除（Task D） |
| `apps/web/src/components/auth/SignOutButton.tsx` | `SidebarUserMenu` 内に internal embed（再export しない） |
| `apps/web/src/components/public/PublicHeader*.tsx` | 完全に置き換え。`(public)/layout.tsx` から import を除去（Task C） |
| `apps/web/src/components/layout/MemberHeader.tsx` | `(member)/layout.tsx` から外す（Task C と同 PR で実施） |
| `apps/web/src/styles/tokens.css` | shell 用トークン 5 件追加（Task A）: `--shell-bar-w`, `--shell-bar-w-collapsed`, `--shell-bar-bg`, `--shell-bar-border`, `--shell-active-bg` |

## レスポンシブ実装方針

- breakpoint は Tailwind デフォルト（sm 640 / md 768 / lg 1024）。本 shell では `md` / `lg` のみ参照
- 折り畳み state:
  - `collapsed: boolean` — lg/md で持続。localStorage key `ubm:shell:collapsed`
  - `drawerOpen: boolean` — sm 専用。route change で auto-close
- aria 属性: drawer は `role="dialog" aria-modal="true"`、collapse toggle は `aria-expanded`
- `SidebarMobileTrigger` は `SidebarShell` 内部 state を context 経由で操作する。layout から直接 setter を渡さない

## ログアウト動線（既存契約踏襲）

- `signOut({ redirectTo: '/login' })` を `SidebarUserMenu` 内のメニュー項目として呼び出し
- 既存 `SignOutButton` をそのまま埋め込む（再実装しない）

## 並列実装可能性

- A（primitive）と B（UserMenu）は別ファイル群に閉じるため、interface 確定後は並列可
- C（public 統合）と D（admin 移行）は同じ shell を参照するため、A/B 完了後の直列
- E（mobile drawer）は A の `SidebarShell` interface 内に閉じるが、内部 state の整合のため A の `useSidebarState` 完了後に着手
- F（visual baseline）は全部完了後に直列
