// task-15: features/admin/components barrel export
// 追記方式厳守（task-16/17 が後続行追加するため、再ソート禁止）
export * from "./_layout/AdminPageHeader";
export * from "./_dashboard/KpiCard";
export * from "./_dashboard/KpiGrid";
export * from "./_dashboard/ZoneDistribution";
export * from "./_dashboard/StatusDistribution";
export * from "./_dashboard/RecentActionsTable";
export * from "./_dashboard/SchemaAlertCard";
export * from "./_members/MembersClientShell";
export * from "./_members/MembersFilters";
export * from "./_members/MembersTable";
export * from "./_members/BulkActionBar";
export * from "./_members/MemberDrawer";
export * from "./_members/MemberDiagnosticsPanel";
// admin-ui-task-d: _shared primitive re-exports for attendance dashboard
export { AdminTable } from "./_shared/AdminTable";
export type { AdminTableColumn, AdminTableProps } from "./_shared/AdminTable";
export { AdminEmptyState } from "./_shared/AdminEmptyState";
export type { AdminEmptyStateProps, AdminEmptyStateIcon } from "./_shared/AdminEmptyState";
export { AdminSectionErrorClient } from "./_shared/AdminSectionErrorClient";
export type { AdminSectionErrorClientProps } from "./_shared/AdminSectionErrorClient";
