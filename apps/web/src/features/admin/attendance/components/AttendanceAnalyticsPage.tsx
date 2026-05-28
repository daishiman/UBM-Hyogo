import { AdminSectionErrorClient } from "@/features/admin/components/_shared";
import { fetchAttendanceAnalyticsBundle } from "@/lib/admin/fetch-attendance";
import type { AttendanceFilterState } from "../lib/read-attendance-filter";
import { AttendanceFilterBar } from "./AttendanceFilterBar";
import { KpiPanel } from "./KpiPanel";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { AttendanceZoneDistributionChart } from "./AttendanceZoneDistributionChart";
import { SessionAttendanceTable } from "./SessionAttendanceTable";
import { MemberAttendanceTable } from "./MemberAttendanceTable";
import { AttendanceTop10Ranking } from "./AttendanceTop10Ranking";
import { AttendanceAbsenteeAlert } from "./AttendanceAbsenteeAlert";

interface Props {
  readonly filterState: AttendanceFilterState;
}

export async function AttendanceAnalyticsPage({ filterState }: Props) {
  const bundle = await fetchAttendanceAnalyticsBundle({
    periodFrom: filterState.periodFrom,
    periodTo: filterState.periodTo,
    zones: filterState.zones.length > 0 ? filterState.zones : null,
    limit: 50,
    lastN: 3,
  });

  const attendeeCount = bundle.bySession.ok
    ? bundle.bySession.data.reduce((a, r) => a + r.attendeeCount, 0)
    : 0;

  return (
    <div data-testid="attendance-analytics-page" className="attendance-analytics-page flex flex-col gap-4">
      <AttendanceFilterBar initial={filterState} />

      {bundle.overview.ok ? (
        <KpiPanel overview={bundle.overview.data} attendeeCount={attendeeCount} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="出席KPI"
          code={bundle.overview.error.code}
          message={bundle.overview.error.message}
        />
      )}

      <div className="attendance-charts-grid">
        <div>
          <h2>出席トレンド</h2>
          {bundle.trend.ok ? (
            <AttendanceTrendChart trend={bundle.trend.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="出席トレンド"
              code={bundle.trend.error.code}
              message={bundle.trend.error.message}
            />
          )}
        </div>
        <div>
          <h2>区画別分布</h2>
          {bundle.zoneDistribution.ok ? (
            <AttendanceZoneDistributionChart data={bundle.zoneDistribution.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="区画別分布"
              code={bundle.zoneDistribution.error.code}
              message={bundle.zoneDistribution.error.message}
            />
          )}
        </div>
      </div>

      <h2>セッション別出席状況</h2>
      {bundle.bySession.ok ? (
        <SessionAttendanceTable rows={bundle.bySession.data} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="セッション別出席状況"
          code={bundle.bySession.error.code}
          message={bundle.bySession.error.message}
        />
      )}

      <h2>会員別出席率</h2>
      {bundle.ranking.ok ? (
        <MemberAttendanceTable rows={bundle.ranking.data} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="会員別出席率"
          code={bundle.ranking.error.code}
          message={bundle.ranking.error.message}
        />
      )}

      <h2>出席ランキング TOP 10</h2>
      {bundle.ranking.ok ? (
        <AttendanceTop10Ranking rows={bundle.ranking.data} />
      ) : null}

      <h2>要フォローアップ</h2>
      {bundle.absentees.ok ? (
        <AttendanceAbsenteeAlert data={bundle.absentees.data} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="要フォローアップ"
          code={bundle.absentees.error.code}
          message={bundle.absentees.error.message}
        />
      )}
    </div>
  );
}
