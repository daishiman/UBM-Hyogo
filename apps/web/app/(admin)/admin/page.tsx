// task-15 + admin-ui-prototype-alignment: /admin ダッシュボード
// AC: GET /admin/dashboard 1 fetch 集約 (KPI 4 + recentActions)
// 失敗時は per-section AdminSectionError に degrade (page 全体 throw を廃止)
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { safeServerFetch } from "../../../src/lib/admin/safe-server-fetch";
import { toAdminDashboardUi } from "../../../src/lib/admin/admin-dashboard-ui";
import {
  AdminPageHeader,
  KpiGrid,
  ZoneDistribution,
  StatusDistribution,
  RecentActionsTable,
  SchemaAlertCard,
} from "../../../src/features/admin/components";
import { AdminSectionError } from "../../../src/features/admin/components/_shared";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const result = await safeServerFetch<AdminDashboardView>("/admin/dashboard");

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
      {result.ok ? (
        <DashboardSections view={result.data} />
      ) : (
        <AdminSectionError
          sectionLabel="ダッシュボード"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}

function DashboardSections({ view }: { view: AdminDashboardView }) {
  const ui = toAdminDashboardUi(view);
  return (
    <>
      {ui.totals.unresolvedSchema > 0 ? <SchemaAlertCard count={ui.totals.unresolvedSchema} /> : null}
      <KpiGrid totals={ui.totals} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ZoneDistribution slices={ui.byZone} />
        <RecentActionsTable items={ui.recentActions} />
      </div>
      <StatusDistribution slices={ui.byStatus} />
      <p className="text-xs text-[var(--ubm-color-text-muted)]">生成日時: {ui.generatedAt}</p>
    </>
  );
}
