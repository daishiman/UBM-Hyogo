// task-15: KPI 4 枚を grid-4 で配置
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { DASHBOARD_KPI_LABELS } from "../../../../lib/admin/dashboardGlossary";
import { KpiCard } from "./KpiCard";

export interface KpiGridProps {
  readonly totals: AdminDashboardView["totals"];
}

export function KpiGrid({ totals }: KpiGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      role="group"
      aria-label="主要指標"
    >
      <KpiCard label={DASHBOARD_KPI_LABELS.totalMembers} value={totals.totalMembers} testId="admin-kpi-card-total" />
      <KpiCard label={DASHBOARD_KPI_LABELS.publicMembers} value={totals.publicMembers} testId="admin-kpi-card-public" />
      <KpiCard
        label={DASHBOARD_KPI_LABELS.untaggedMembers}
        value={totals.untaggedMembers}
        tone={totals.untaggedMembers > 0 ? "warning" : "neutral"}
        testId="admin-kpi-card-untagged"
      />
      <KpiCard
        label={DASHBOARD_KPI_LABELS.unresolvedSchema}
        value={totals.unresolvedSchema}
        tone={totals.unresolvedSchema > 0 ? "danger" : "success"}
        testId="admin-kpi-card-schema"
      />
    </div>
  );
}
