# Task A — SidebarShell primitive (collapsible core)

[実装区分: 実装仕様書]

## 目的

3 層（公開 / 会員 / 管理）で再利用される collapsible Sidebar の core primitive を新設する。
本タスクで mobile drawer（Task E）と UserMenu（Task B）の hosting point だけ用意し、
中身は Task B / E が埋める。

## 変更対象ファイル

### 新規

- `apps/web/src/components/shell/SidebarShell.tsx` (Client)
- `apps/web/src/components/shell/SidebarShell.server.tsx` (Server)
- `apps/web/src/components/shell/SidebarBrand.tsx` (Client)
- `apps/web/src/components/shell/SidebarNav.tsx` (Client)
- `apps/web/src/components/shell/SidebarNavGroup.tsx` (Client)
- `apps/web/src/components/shell/SidebarNavItem.tsx` (Client)
- `apps/web/src/components/shell/SidebarCollapseToggle.tsx` (Client)
- `apps/web/src/components/shell/useSidebarState.ts` (Client hook)
- `apps/web/src/components/shell/SidebarShellContext.tsx` (Client context: drawer/collapse 操作用)
- `apps/web/src/components/shell/shell-config.ts` (純関数)
- `apps/web/src/components/shell/icons.tsx` (純粋 svg)
- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`
- `apps/web/src/components/shell/__tests__/shell-config.spec.ts`
- `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`

### 編集

- `apps/web/src/styles/tokens.css`: shell 用 OKLch トークン 5 件追加

## シグネチャ

```ts
// shell-config.ts
export type ShellRole = 'viewer' | 'member' | 'admin'

export type ShellNavItemId =
  | 'home' | 'directory' | 'register'
  | 'profile'
  | 'dashboard' | 'attendance' | 'members' | 'tag-queue'
  | 'schema' | 'meeting' | 'requests' | 'identity' | 'audit'

export type ShellNavItem = {
  id: ShellNavItemId
  href: string
  label: string
  icon: ShellNavItemId
  badge?: { tone: 'warn' | 'danger' | 'info'; count: number }
}
export type ShellNavGroupId = 'public' | 'members' | 'admin'
export type ShellNavGroup = {
  id: ShellNavGroupId
  label: string
  items: ShellNavItem[]
}

export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[]

export function isNavItemActive(itemHref: string, pathname: string): boolean
```

```ts
// useSidebarState.ts
export type SidebarStateMode = 'expanded' | 'collapsed'
export function useSidebarState(): {
  mode: SidebarStateMode
  drawerOpen: boolean
  toggleCollapsed: () => void
  setDrawerOpen: (open: boolean) => void
}
// 永続化キー: 'ubm:shell:collapsed' (localStorage、JSON boolean)
```

```tsx
// SidebarShell.tsx (Client)
export type SidebarShellProps = {
  role: ShellRole
  user: { displayName: string; email: string; initials: string } | null
  navGroups: ShellNavGroup[]
  activePath: string
  mobileTriggerSlot: ReactNode // Task E が埋める。drawer/collapse setter は context 経由
  children: ReactNode
}
export function SidebarShell(props: SidebarShellProps): JSX.Element
```

```tsx
// SidebarShell.server.tsx (Server)
export async function SidebarShellServer(props: {
  activePath: string
  children: ReactNode
  mobileTriggerSlot: ReactNode
}): Promise<JSX.Element>
// 内部で getSession() → role 判定 → buildNavForRole() → <SidebarUserMenu /> → <SidebarShell />
// admin の場合のみ getSchemaDiffCount() を await
```

## 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `session`（server 側で取得）, `pathname`（呼出側 layout が渡す）, localStorage（client） |
| 出力 | nav rendering + active state + collapsed/expanded UI |
| 副作用 | `localStorage.setItem('ubm:shell:collapsed', ...)` のみ。API call なし |
| エラー | `getSession` 失敗時は role=viewer にフォールバック（throw しない） |

## トークン追加（tokens.css）

```css
:root {
  --shell-bar-w: 17rem;          /* 272px */
  --shell-bar-w-collapsed: 4rem; /* 64px  */
  --shell-bar-bg: var(--surface-bg);
  --shell-bar-border: var(--border);
  --shell-active-bg: oklch(96% 0.02 70);
}
[data-theme='cool'] {
  --shell-active-bg: oklch(96% 0.02 240);
}
```

## レイアウト規約

- 展開時: `<aside>` 幅 `var(--shell-bar-w)`、`<main>` flex-1
- 折り畳み時: `<aside>` 幅 `var(--shell-bar-w-collapsed)`、nav item は icon のみ（label を `sr-only`）
- mobile（`< md`）: `<aside>` 自体は hidden、Task E の drawer が overlay 描画
- a11y: `<nav aria-label="サイドバー">`、collapse toggle に `aria-expanded`、active item に `aria-current="page"`

## テスト

| ファイル | ケース |
|---------|------|
| `shell-config.spec.ts` | `buildNavForRole('viewer')` が public のみ / `'member'` が public+members / `'admin'` が 3 グループ全部 + schemaDiffCount badge を返す |
| `useSidebarState.spec.tsx` | 初期値 expanded、toggle で collapsed、localStorage に反映、SSR 安全 |
| `SidebarShell.spec.tsx` | viewer=3 / member=4 / admin=13 nav item、active state、collapsed 時に label が `sr-only` |

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test --run src/components/shell
```

## DoD

1. 上記 3 spec が green
2. `pnpm typecheck && pnpm lint` green
3. `buildNavForRole` が 3 ロール × `schemaDiffCount` 0/正数で snapshot 安定
4. 旧 `AdminSidebar` は本タスクでは未削除（D で削除）
5. mobile drawer 用の `mobileTriggerSlot` を prop として受け入れ、UserMenu は `SidebarShellServer` が role 判定後に注入する
