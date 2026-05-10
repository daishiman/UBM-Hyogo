// task-15: /admin ダッシュボード
// AC: GET /admin/dashboard 1 fetch 集約 (KPI 4 + recentActions)
// `byZone` / `byStatus` は API 未提供、web local mapper で optional placeholder
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { fetchAdmin } from "../../../src/lib/admin/server-fetch";
import { toAdminDashboardUi } from "../../../src/lib/admin/admin-dashboard-ui";
import {
  AdminPageHeader,
  KpiGrid,
  ZoneDistribution,
  StatusDistribution,
  RecentActionsTable,
  SchemaAlertCard,
} from "../../../src/features/admin/components";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const view = await fetchAdmin<AdminDashboardView>("/admin/dashboard");
  const ui = toAdminDashboardUi(view);

  return (
    <section aria-labelledby="admin-dashboard-h" className="flex flex-col gap-4">
      <AdminPageHeader
        title="ダッシュボード"
        description="UBM 兵庫支部会のメンバー状況と直近のアクション"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "ダッシュボード" }]}
      />
      <h1 id="admin-dashboard-h" className="sr-only">
        ダッシュボード
      </h1>
      {ui.totals.unresolvedSchema > 0 ? <SchemaAlertCard count={ui.totals.unresolvedSchema} /> : null}
      <KpiGrid totals={ui.totals} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ZoneDistribution slices={ui.byZone} />
        <RecentActionsTable items={ui.recentActions} />
      </div>
      <StatusDistribution slices={ui.byStatus} />
      <p className="text-xs text-[var(--ubm-color-text-muted)]">生成日時: {ui.generatedAt}</p>
    </section>
  );
}
