// admin-attendance-analytics-redesign: full UI redesign
// 不変条件 #5: D1 直接アクセス禁止 — fetch-attendance.ts → safeServerFetch 経由
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { AttendanceAnalyticsPage } from "@/features/admin/attendance/components/AttendanceAnalyticsPage";
import { readFilterFromQuery } from "@/features/admin/attendance/lib/read-attendance-filter";

export const dynamic = "force-dynamic";

const flat = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const queryRecord: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) queryRecord[k] = flat(v);
  const filterState = readFilterFromQuery(queryRecord);

  return (
    <section
      aria-labelledby="admin-attendance-analytics-h"
      data-testid="attendance-analytics-page"
      className="attendance-analytics-page flex flex-col gap-4"
    >
      <AdminPageHeader
        eyebrow="管理 / ダッシュボード"
        title="出席ダッシュボード"
        description="出席率の移り変わり・出席回数べつの人数・欠席フォロー対象を確認"
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "ダッシュボード", href: "/admin/dashboard" },
          { label: "出席" },
        ]}
        headingId="admin-attendance-analytics-h"
      />
      <AttendanceAnalyticsPage filterState={filterState} />
    </section>
  );
}
