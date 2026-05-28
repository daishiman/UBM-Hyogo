# Phase 5: 実装手順

## 5.1 変更対象ファイル一覧 (CONST_005)

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/(admin)/layout.tsx` | 編集 | topbar 内固定文字列 / 空 actions slot 撤去。schema diff fetch + `AdminSidebar` に props 注入。session を sidebar に渡す |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 (実質書き直し) | client component 化。3 group / active / badge / user-chip footer 配線 |
| `apps/web/src/components/layout/AdminSidebarNavItem.tsx` | 新規 | nav item 1 件分の client component。active 判定 (`usePathname`) と icon + badge 描画 |
| `apps/web/src/components/layout/AdminBrandBlock.tsx` | 新規 | sidebar 上部 brand mark + title 2 行 (server 可) |
| `apps/web/src/components/layout/isActive.ts` | 新規 | active 判定純関数。spec 単体テスト容易化のため抽出 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 新規 | AC-2..AC-5 検証 |
| `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 新規 | active 判定境界 |
| `apps/web/src/components/layout/__tests__/isActive.spec.ts` | 新規 | 純関数境界 (`/` / `/admin` / `/admin/members/123` 等) |
| `apps/web/app/(admin)/layout.spec.tsx` | 編集 | AC-1 検証追加 (固定「管理」非表示) |
| `apps/web/src/lib/admin/server-fetch.ts` | 編集 | Playwright screenshot 用 `PLAYWRIGHT_TASK17_ADMIN_FIXTURE` に dashboard / members fixture を追加し、Phase 11 を mock API port 起動順へ依存させない |
| `apps/web/playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts` | 新規 | Phase 11 canonical screenshot 6 枚と visual review metadata を生成 |
| `apps/web/src/components/ui/Avatar.tsx` | 流用のみ | sidebar footer の user-chip で既存 Avatar を使う。新規 `_shared/Avatar.tsx` は作らない |

> 削除対象ファイルなし。`_layout/AdminPageHeader.tsx` は無変更。

## 5.2 主要型・props シグネチャ

```ts
// isActive.ts
export function isActive(itemHref: string, pathname: string): boolean;

// AdminSidebar.tsx
export interface AdminSidebarProps {
  readonly schemaDiffCount: number;
  readonly userDisplayName: string;
  readonly userEmail: string;
}
export function AdminSidebar(props: AdminSidebarProps): JSX.Element;

// AdminSidebarNavItem.tsx ('use client')
export interface AdminSidebarNavItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly badge?: { tone: 'warn' | 'info' | 'neutral'; count: number } | null;
}
export function AdminSidebarNavItem(props: AdminSidebarNavItemProps): JSX.Element;

// AdminBrandBlock.tsx
export function AdminBrandBlock(): JSX.Element;

// layout.tsx 内 fetch
type SchemaDiffSummary = { readonly unresolvedCount: number };
```

## 5.3 各ファイル差分方針 (疑似コード)

### `layout.tsx`

```tsx
const session = await getSession(); // 既存 + null/admin 二段 redirect
const diff = await safeServerFetch<SchemaDiffItems>('/admin/schema/diff', { method: 'GET' })
  .catch(() => ({ items: [] }));
const unresolvedCount = diff.items.filter(i => i.status === 'queued').length;

return (
  <div className="ubm-admin-shell ..." data-shell-mode="sidebar">
    <aside data-shell="sidebar">
      <AdminSidebar
        schemaDiffCount={unresolvedCount}
        userDisplayName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
      />
    </aside>
    <main data-route="admin">{children}</main>
  </div>
);
// header は撤去
```

### `AdminSidebar.tsx`

```tsx
'use client';
const groups = [
  { label: 'Public', items: [/* order 1-3 */] },
  { label: 'Members', items: [/* order 4 */] },
  { label: 'Admin', items: [/* order 5-13 */] },
];
return (
  <nav aria-label="管理メニュー" className="admin-sidebar" data-shell-block="sidebar-nav">
    <AdminBrandBlock />
    {groups.map(g => (
      <section key={g.label} data-component="admin-nav-section">
        <div data-component="admin-nav-label">{g.label}</div>
        <ul>{g.items.map(it => <AdminSidebarNavItem key={it.href} {...withBadge(it)} />)}</ul>
      </section>
    ))}
    <footer data-component="admin-sidebar-footer">
      <div data-component="user-chip">
        <Avatar size="sm" name={userDisplayName} />
        <div data-component="user-chip-body">
          <span data-component="user-chip-name">{userDisplayName}</span>
          <span data-component="user-chip-email">{userEmail}</span>
        </div>
      </div>
      <SignOutButton />
    </footer>
  </nav>
);
```

### `AdminSidebarNavItem.tsx`

```tsx
'use client';
const pathname = usePathname();
const active = isActive(href, pathname);
return (
  <li>
    <Link href={href} data-active={active} data-component="admin-nav-item" className="...">
      <span data-component="admin-nav-icon">{icon}</span>
      <span>{label}</span>
      {badge && badge.count > 0 ? <Chip tone={badge.tone} size="sm">{badge.count}</Chip> : null}
    </Link>
  </li>
);
```

### `isActive.ts`

```ts
export function isActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  if (itemHref === '/admin') return pathname === '/admin';
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
```

## 5.4 入力・出力・副作用

- 入力: `usePathname()` (client) / `getSession()` (server) / `GET /admin/schema/diff` (server fetch)
- 出力: AdminAppShell DOM ツリー (sidebar + main)
- 副作用: layout 描画ごとの schema diff fetch 1 回 / fetch 失敗時 `logger.warn`
- エラーハンドリング: schema diff fetch 失敗 → `schemaDiffCount=0` (silent degrade) / auth 失敗 → 既存 redirect
- 正本用語: schema diff の未解決状態は `status="queued"`。`type="unresolved"` は4ペイン分類の一種であり badge 件数のフィルタには使わない。

## 5.5 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- --run components/layout
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11 PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm build
```
