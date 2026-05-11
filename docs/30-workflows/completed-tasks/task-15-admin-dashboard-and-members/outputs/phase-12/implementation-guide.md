# task-15: Admin Dashboard & Members 実装ガイド

## 概要
Cloudflare Workers + Next.js App Router の `apps/web` に、管理ダッシュボード `/admin` と会員管理 `/admin/members` を実装。既存 API endpoint（`/admin/dashboard` / `/admin/members`）のみ消費し、shared schema は無変更（FB-W0-01 遵守）。

## 追加ファイル

### lib
- `apps/web/src/lib/format/datetime.ts` — `formatJstDateTime(iso)` JST 表示 helper
- `apps/web/src/lib/admin/admin-dashboard-ui.ts` — `toAdminDashboardUi()` mapper。shared schema 外の `byZone` / `byStatus` を loose parse して optional に吸収
- `apps/web/src/lib/admin/dashboard-ui.test.ts` — mapper 4 case

### features/admin/components
| path | 役割 |
|------|------|
| `_layout/AdminPageHeader.tsx` | breadcrumb + title + action slot |
| `_dashboard/KpiCard.tsx` | KPI 単体セル（tone: ok/warn/danger） |
| `_dashboard/KpiGrid.tsx` | 4 KPI（total / public / untagged / schema） |
| `_dashboard/ZoneDistribution.tsx` | SVG bar chart（自前実装、recharts 不使用） |
| `_dashboard/StatusDistribution.tsx` | chip group（public / member_only / hidden） |
| `_dashboard/RecentActionsTable.tsx` | 最近の操作 + 監査ログリンク |
| `_dashboard/SchemaAlertCard.tsx` | schema diff > 0 のときのみ表示 |
| `_members/MembersFilters.tsx` | q (onBlur) / zone / filter / sort + 「更新中…」 |
| `_members/MembersTable.tsx` | チェックボックス + マスク email + pagination |
| `_members/BulkActionBar.tsx` | publish / hide / soft-delete (try/finally で busy リセット) |
| `_members/MemberDrawer.tsx` | 行詳細 Drawer（cancelled flag で race 抑止） |
| `_members/MembersClientShell.tsx` | URL state sync + 選択 set + drawer state |
| `index.ts` | barrel export |

### app routes（変更）
- `apps/web/app/(admin)/layout.tsx` — `getSession` ガード + `grid-cols-[240px_1fr]` + `AdminSidebar`
- `apps/web/app/(admin)/admin/page.tsx` — 新 components 利用に切替
- `apps/web/app/(admin)/admin/members/page.tsx` — `MembersClientShell` に切替

### tests（apps/web/src/features/admin/components/__tests__/）
`KpiGrid` / `MembersFilters` / `MembersTable` / `RecentActionsTable` / `BulkActionBar` の 5 file × 5-6 case。各 file の a11y check は `jest-axe` 実テストとして実装済み。

## 設計 invariants
1. **shared 不変**: `AdminDashboardView` への `byZone`/`byStatus` 追加は `web` 側 mapper で吸収（FB-W0-01）
2. **token のみ**: `var(--ubm-color-*)` / `var(--ubm-radius-*)` のみ。HEX 直書き 0 件
3. **D1 直接アクセス禁止**: `apps/web` は `/admin/*` API 経由
4. **Server vs Client**: page = Server（`await getSession()` + `await fetch()`）, interactive subtree = `"use client"`
5. **URL state**: q/zone/filter/sort/page を `useSearchParams` + `router.replace` で sync。`useTransition` で「更新中…」表示

## 検証 (Phase 9)
- `pnpm -F @ubm-hyogo/web typecheck` ✅
- `pnpm -F @ubm-hyogo/web lint` ✅
- `pnpm -F @ubm-hyogo/web test` ✅ 541 pass / 5 todo / 1 skip
- `pnpm -F @ubm-hyogo/web build` ✅ 27 routes
- design token gate ✅ 0 件
- `pnpm -F @ubm-hyogo/web test` ✅ 528 pass / 1 skip（`jest-axe` 導入後）
- `pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/task15-admin-screenshots.spec.ts` ✅ 1 pass

## 視覚証跡

`outputs/phase-11/` に配置済み:

- `admin-dashboard-default.png`
- `admin-dashboard-schema-alert.png`
- `admin-dashboard-zone-placeholder.png`
- `admin-members-default.png`
- `admin-members-filter-published.png`
- `admin-members-bulk-selected.png`
- `admin-members-drawer-open.png`
- `admin-members-empty.png`
- `admin-layout-sidebar-active.png`
- `phase11-capture-metadata.json`
- `manual-test-result.md`
- `ui-sanity-visual-review.md`

## 残課題
- Phase 13 の commit/push/PR は user 明示承認まで未実行
