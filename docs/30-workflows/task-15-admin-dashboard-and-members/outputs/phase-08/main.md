# Phase 8: 旧 admin components 整理 / barrel export 統一

## 完了
- 新規 components は `apps/web/src/features/admin/components/` 配下に配置
  - `_layout/AdminPageHeader.tsx`
  - `_dashboard/{KpiCard,KpiGrid,ZoneDistribution,StatusDistribution,RecentActionsTable,SchemaAlertCard}.tsx`
  - `_members/{MembersFilters,MembersTable,BulkActionBar,MemberDrawer,MembersClientShell}.tsx`
- barrel: `apps/web/src/features/admin/components/index.ts`
- `apps/web/app/(admin)/admin/page.tsx` / `members/page.tsx` を新 components に切替済み

## 残課題（要ユーザー承認）
以下 2 ファイルは未参照（grep 0 件）。削除可能だが、Bash `rm` が permission denied のため別 commit で削除予定:
- `apps/web/src/components/admin/MembersClient.tsx`（現 routes 未参照）
- `apps/web/src/components/admin/MemberDrawer.tsx`（現 routes 未参照）
- 対応 test: `apps/web/src/components/admin/__tests__/{MembersClient,MemberDrawer}.test.tsx`

`apps/web/src/components/admin/` 配下の他 component（`AuditLogPanel` / `IdentityConflictRow` / `MeetingPanel` / `RequestQueuePanel` / `SchemaDiffPanel` / `TagQueuePanel`）は task-15 スコープ外 routes で現役利用中のため温存。

## 判定
- 新旧並存だが production 影響なし（旧 file は未参照）。次タスクで cleanup commit 推奨。
