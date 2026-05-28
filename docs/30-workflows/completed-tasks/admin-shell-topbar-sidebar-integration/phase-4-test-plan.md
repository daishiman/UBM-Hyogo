# Phase 4: テスト計画

## 4.1 vitest spec

| spec ファイル | 種別 | 目的 | AC |
|-------------|------|------|------|
| `apps/web/app/(admin)/layout.spec.tsx` | 拡充 | 固定「管理」文字列が消えたこと / breadcrumb-slot DOM が無いこと | AC-1 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 新規 | nav 項目数 / group ラベル / active 判定 / badge 表示 / footer 構成 | AC-2..AC-5 |
| `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 新規 | active 判定純関数の境界 (`/admin` 完全一致 / セグメント prefix / 完全不一致) | AC-2 |
| `apps/web/src/components/layout/__tests__/AdminBrandBlock.spec.tsx` | 新規 (任意) | brand mark + title の 2 ライン構造 | - |
| `apps/web/src/components/layout/__tests__/isActive.spec.ts` | 新規 | 純関数境界 (`/` / `/admin` / `/admin/members/123` 等) | AC-2 |

## 4.2 Playwright spec

- 本 task では新規追加しない (visual / e2e は Task E スコープ)

## 4.3 grep gate (CI 補強)

- `grep -F '管理' apps/web/app/(admin)/layout.tsx` が 0 件 (AC-1)
- `grep -rn '<Breadcrumb' apps/web/app/(admin)/admin/` は Task C 完了後ゲート。本 task では現行残存を許容し、Task C owner を Phase 8/13 に明記する

## 4.4 mock 戦略

- `usePathname` は `next/navigation` を vi.mock で差し替え
- session は layout server boundary が前提のため、AdminSidebar spec では props 直接注入 (session を再 fetch しない設計を spec で固定)
- `safeServerFetch` は layout.spec.tsx で MSW or vi.mock により成功 / 失敗の両ケースを再現
