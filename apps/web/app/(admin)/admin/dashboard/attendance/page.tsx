// admin-attendance-analytics-redesign: full UI redesign
// 不変条件 #5: D1 直接アクセス禁止 — fetch-attendance.ts → safeServerFetch 経由
import { AttendanceAnalyticsPage } from "@/features/admin/attendance/components/AttendanceAnalyticsPage";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <AttendanceAnalyticsPage searchParams={sp} />;
}
