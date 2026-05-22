# Phase 8: 旧 admin components 整理 / barrel export 統一

## 完了
- 新規 components は `apps/web/src/features/admin/components/` 配下に配置
  - `_layout/AdminPageHeader.tsx`
  - `_dashboard/{KpiCard,KpiGrid,ZoneDistribution,StatusDistribution,RecentActionsTable,SchemaAlertCard}.tsx`
  - `_members/{MembersFilters,MembersTable,BulkActionBar,MemberDrawer,MembersClientShell}.tsx`
- barrel: `apps/web/src/features/admin/components/index.ts`
- `apps/web/app/(admin)/admin/page.tsx` / `members/page.tsx` を新 components に切替済み

## 旧 admin components の確認
`apps/web/src/components/admin/MembersClient.tsx` と `apps/web/src/components/admin/MemberDrawer.tsx` は現 tree に存在しない。`apps/web/src/components/admin/` 配下の他 component（`AuditLogPanel` / `IdentityConflictRow` / `MeetingPanel` / `RequestQueuePanel` / `SchemaDiffPanel` / `TagQueuePanel`）は task-15 スコープ外 routes で現役利用中のため温存。

## 判定
- 新 `apps/web/src/features/admin/components/` が task-15 正本。旧 MembersClient / MemberDrawer の cleanup 未タスクは不要。
