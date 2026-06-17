import { AdminSectionErrorClient } from "@/features/admin/components/_shared";
import { fetchAttendanceAnalyticsBundle } from "@/lib/admin/fetch-attendance";
import type { AttendanceFilterState } from "../lib/read-attendance-filter";
import { AttendanceFilterBar } from "./AttendanceFilterBar";
import { KpiPanel } from "./KpiPanel";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { AttendanceZoneDistributionChart } from "./AttendanceZoneDistributionChart";
import { AttendanceAbsenteeAlert } from "./AttendanceAbsenteeAlert";
import { AttendanceDetailTabs } from "./AttendanceDetailTabs";

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
      <p className="attendance-page-guide">
        期間と累計の出席回数で絞り込み、出席率の移り変わり、出席回数べつの人数、要フォロー対象を確認します。
      </p>
      <AttendanceFilterBar initial={filterState} />

      <section className="attendance-zone attendance-zone--primary" aria-labelledby="attendance-primary-heading">
        <div className="attendance-zone-heading">
          <h2 id="attendance-primary-heading">全体の状況</h2>
          <p className="attendance-section-intro">全体の健全性と、今日フォローすべき対象を最初に判断します。</p>
        </div>
        <div className="attendance-primary-grid">
          {bundle.overview.ok ? (
            <KpiPanel overview={bundle.overview.data} attendeeCount={attendeeCount} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="出席のおもな指標"
              code={bundle.overview.error.code}
              message={bundle.overview.error.message}
            />
          )}
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
      </section>

      <section className="attendance-zone attendance-zone--trend" aria-labelledby="attendance-trend-heading">
        <div className="attendance-zone-heading">
          <h2 id="attendance-trend-heading">出席の移り変わり</h2>
          <p className="attendance-section-intro">月ごとの移り変わりと出席回数のはばから、参加のかたよりを確認します。</p>
        </div>
        <div className="attendance-charts-grid">
          <article className="attendance-analysis-card">
            <h3>月ごとの出席の移り変わり</h3>
            <p className="attendance-section-intro">月ごとの延べ出席数と開催回数の変化を確認します。</p>
            {bundle.trend.ok ? (
              <AttendanceTrendChart trend={bundle.trend.data} />
            ) : (
              <AdminSectionErrorClient
                sectionLabel="出席の移り変わり"
                code={bundle.trend.error.code}
                message={bundle.trend.error.message}
              />
            )}
          </article>
          <article className="attendance-analysis-card">
            <h3>出席回数べつの人数</h3>
            <p className="attendance-section-intro">未出席や参加が少ない人のかたよりを確認します。</p>
            {bundle.zoneDistribution.ok ? (
              <AttendanceZoneDistributionChart data={bundle.zoneDistribution.data} />
            ) : (
              <AdminSectionErrorClient
                sectionLabel="出席回数べつの人数"
                code={bundle.zoneDistribution.error.code}
                message={bundle.zoneDistribution.error.message}
              />
            )}
          </article>
        </div>
      </section>

      <section className="attendance-zone attendance-zone--detail" aria-labelledby="attendance-detail-heading">
        <div className="attendance-zone-heading">
          <h2 id="attendance-detail-heading">くわしい一覧</h2>
          <p className="attendance-section-intro">詳細テーブルは必要な観点だけを切り替えて確認します。</p>
        </div>
        <AttendanceDetailTabs bySession={bundle.bySession} ranking={bundle.ranking} />
      </section>
    </div>
  );
}
