# Phase 2 Output: 設計

## 判定

API、Web UI、shared schema の責務を分離する設計で確定する。

## 責務境界

- `packages/shared/src/admin/search.ts`: query schema、limits、URL helper
- `apps/api/src/routes/admin/members.ts`: list/detail query execution
- `apps/api/src/routes/admin/member-delete.ts`: delete/restore mutation and audit
- `apps/web/app/(admin)/admin/members/page.tsx`: Server Component fetch
- `apps/web/src/components/admin/MembersClient.tsx`: URL state and table UI
- `apps/web/src/components/admin/MemberDrawer.tsx`: detail, audit, delete/restore UI
