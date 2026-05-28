# Phase 6: テスト追加

## `isActive.spec.ts`

- `isActive('/', '/')` → true
- `isActive('/', '/admin')` → false
- `isActive('/admin', '/admin')` → true
- `isActive('/admin', '/admin/members')` → false
- `isActive('/admin/members', '/admin/members')` → true
- `isActive('/admin/members', '/admin/members/123')` → true
- `isActive('/admin/members', '/admin/membership')` → false (prefix 誤一致防止)
- `isActive('/members', '/admin/members')` → false

## `AdminSidebarNavItem.spec.tsx`

- pathname mock = `/admin/members` で `/admin/members` item に `data-active="true"`
- badge prop が `null` / `{count:0}` のとき badge DOM 非表示
- badge prop `{tone:'warn', count:3}` で Chip 描画 + 文言 "3" 含む

## `AdminSidebar.spec.tsx`

- 3 group ラベル `Public` / `Members` / `Admin` が出力される (AC-3)
- 全 13 nav item が描画される
- `schemaDiffCount=0` 時 schema 行に badge 無し / `=2` 時 badge "2" 描画 (AC-4)
- `layout.spec.tsx` で `status="queued"` のみ schemaDiffCount として数え、`resolved` を除外する (AC-4 / 正本用語)
- `admin-shell-topbar-sidebar-integration.spec.ts` で `/admin` / `/admin/members` / `/admin/schema` の active 1 件、mobile sidebar collapse、topbar absent、schema badge count 3 を screenshot と locator assertion で検証する (Phase 11)
- footer に `user-chip-name` `user-chip-email` `SignOutButton` が含まれる (AC-5)
- pathname mock `/admin/tags` で `/admin/tags` のみ active (AC-2)

## `layout.spec.tsx` (追加ケース)

- topbar 内 `data-component="admin-breadcrumb-slot"` が無い / 固定文字列「管理」が無い (AC-1)
- `safeServerFetch` を mock 失敗にしても layout が render 成功し badge は表示されない

## `AdminBrandBlock.spec.tsx` (任意)

- brand mark 要素 (img or svg) と title テキストが描画される
- 2 ライン構造 (brand / subtitle) が `data-component` で識別可能
