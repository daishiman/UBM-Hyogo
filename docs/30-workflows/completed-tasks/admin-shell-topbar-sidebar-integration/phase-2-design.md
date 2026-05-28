# Phase 2: 設計

## 2.1 AdminAppShell / Topbar slot 契約

### server / client 境界

- `app/(admin)/layout.tsx` は **server component** を維持 (auth gate を server 側で保持・不変条件 #11 #5 維持)
- topbar は **breadcrumb 表示の責務を持たない**。layout は構造 (`<header data-shell="topbar">`) と空の slot コンテナだけを描画し、**ページ側 `AdminPageHeader` が page 内で breadcrumb / title / actions を完結**させる
- 旧 `data-component="admin-breadcrumb-slot"` / `admin-topbar-actions` の DOM は撤去 (slot 機構は採用しない / page-head 集約方針へ統一)。issue #894/#895 で slot 配線を試みた結果、二重描画リスクが上回ったため **slot 廃止して page-head に一本化** が再整流方針

### topbar の最終形

```
// topbar DOM は描画しない。
// page-head / breadcrumb / actions は各 page の AdminPageHeader が所有する。
```

**決定**: header 自体を撤去し、`main` の padding / rhythm で余白を担保する。空 header を残すと slot 再発生と二重描画の温床になる。

レスポンシブ hamburger は本 task では新設しない。未実装 control を置かず、Task E の mobile viewport で破綻が出た場合は同サイクル内で CSS collapse のみ修正する。

## 2.2 schema diff 件数取得経路

- `layout.tsx` 内で既存 `GET /admin/schema/diff` を `safeServerFetch` で 1 回呼ぶ。`summary=1` query parameter は追加しない
- 既存 endpoint レスポンス全件から `status === "queued"` 件数を派生する。正本では `queued` が未解決状態で、`type === "unresolved"` は added / changed / removed と並ぶ分類の一種に過ぎない
- 結果を `<AdminSidebar schemaDiffCount={count} />` に props で渡す
- fetch 失敗時は `schemaDiffCount=0` (badge 非表示)・logger.warn のみ・layout は redirect しない (unauth は既存 auth gate が処理)

## 2.3 AdminSidebar 設計

### nav 項目テーブル

| order | group | label | href | icon | badge |
|------|-------|-------|------|---------------------|-------|
| 1 | Public | ホーム | `/` | `Home` | - |
| 2 | Public | 会員ディレクトリ | `/members` | `Users` | - |
| 3 | Public | 登録 | `/register` | `UserPlus` | - |
| 4 | Members | マイページ | `/profile` | `User` | - |
| 5 | Admin | ダッシュボード | `/admin` | `LayoutDashboard` | - |
| 6 | Admin | 出席分析 | `/admin/dashboard/attendance` | `BarChart3` | - |
| 7 | Admin | 会員管理 | `/admin/members` | `Users` | - |
| 8 | Admin | タグキュー | `/admin/tags` | `Tags` | - |
| 9 | Admin | schema | `/admin/schema` | `Database` | `schemaDiffCount > 0` で warn |
| 10 | Admin | 開催日 | `/admin/meetings` | `CalendarDays` | - |
| 11 | Admin | 依頼キュー | `/admin/requests` | `Inbox` | - |
| 12 | Admin | Identity重複 | `/admin/identity-conflicts` | `GitMerge` | - |
| 13 | Admin | 監査ログ | `/admin/audit` | `ScrollText` | - |

`lucide-react` は現行依存に無いため追加しない。必要な nav icon は最小 inline SVG を `AdminSidebarNavItem` 内に閉じ、新規 icon package は追加しない。

### active 判定ロジック

```ts
function isActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  if (itemHref === '/admin') return pathname === '/admin'; // ダッシュボード root は完全一致
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
```

- ルート `/admin` は完全一致のみ (さもないと全 admin route で `/admin` も active になる)
- それ以外は完全一致 + セグメント prefix (`/admin/members/123` で `/admin/members` を active 化)
- 同時 active は 1 件まで (href の長い順に評価 = テーブル順依存を排除)

### sidebar-footer 構成

```tsx
<footer data-component="admin-sidebar-footer">
  <div data-component="user-chip">
    <Avatar size="sm" name={session.user.name} />
    <div data-component="user-chip-body">
      <span data-component="user-chip-name">{session.user.name}</span>
      <span data-component="user-chip-email">{session.user.email}</span>
    </div>
  </div>
  <SignOutButton />
</footer>
```

- session は layout server boundary で取得済 → `AdminSidebar` に props で渡す (client 側で session を再 fetch しない)
- Avatar は既存 `apps/web/src/components/ui/Avatar.tsx` を流用する。`_shared/Avatar.tsx` は新規作成しない

## 2.4 命名規則

- DOM hook: `data-component="admin-{block}"` / `data-shell="{topbar|sidebar|main}"` / `data-active="true|false"` を踏襲
- ファイル: client island は `AdminSidebar.tsx` (client) / 内部分割は `AdminSidebarNavItem.tsx` (client) / `AdminBrandBlock.tsx` (server 可・state 不要)

## 2.5 既存 component との関係

- `AdminPageHeader` の `breadcrumbs?` props は **維持** (廃止しない)。Task C で各 page から `AdminPageHeader` 経由で breadcrumb を渡すよう統一する
- `_shared/` 群 (AdminSectionCard 等) は無変更
- `SignOutButton` は流用 (既存 `components/auth/SignOutButton`)
