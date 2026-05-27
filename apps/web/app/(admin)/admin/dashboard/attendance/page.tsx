// admin-ui-task-d: /admin/dashboard/attendance を AdminPageHeader + KpiCard + AdminTable 構成へ
// 不変条件 #5: D1 直接アクセス禁止 — safeServerFetch 経由で内部 API を呼ぶ
// AC-D6: 既存 3 endpoint を再利用、新規 endpoint 追加禁止
import { safeServerFetch } from "../../../../../src/lib/admin/safe-server-fetch";
import { AdminPageHeader } from "../../../../../src/features/admin/components";
import {
  AttendanceDashboardSections,
  type AttendanceOverview,
  type MemberAttendanceRanking,
  type SessionAttendanceRow,
} from "./AttendanceDashboardSections.client";

export const dynamic = "force-dynamic";

export default async function AdminAttendanceDashboardPage() {
  const [overviewResult, bySessionResult, rankingResult] = await Promise.all([
    safeServerFetch<AttendanceOverview>("/admin/dashboard/attendance/overview"),
    safeServerFetch<SessionAttendanceRow[]>(
      "/admin/dashboard/attendance/by-session?limit=20",
    ),
    safeServerFetch<MemberAttendanceRanking[]>(
      "/admin/dashboard/attendance/ranking?limit=20",
    ),
  ]);

  return (
    <section
      aria-label="出席分析"
      data-testid="admin-attendance-dashboard"
      className="flex flex-col gap-4"
    >
      <AdminPageHeader
        title="出席分析"
        description="セッション別と会員別の出席状況を確認します"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/admin" },
          { label: "出席分析" },
        ]}
        actions={
          <a
            className="ui-btn ui-btn--ghost"
            href="/admin/dashboard/attendance"
            data-testid="attendance-refresh"
          >
            再取得
          </a>
        }
      />
      <AttendanceDashboardSections
        overviewResult={overviewResult}
        bySessionResult={bySessionResult}
        rankingResult={rankingResult}
      />
    </section>
  );
}
