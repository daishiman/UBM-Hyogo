"use client";

// admin-ui-task-d: attendance dashboard の client island
// page.tsx は Server Component で fetch を所有し、本 module が関数 props を含む primitive 描画を担当する。
import {
  AdminEmptyState,
  AdminSectionErrorClient,
  AdminTable,
  KpiCard,
  type AdminTableColumn,
  type KpiTone,
} from "../../../../../src/features/admin/components";

export interface AttendanceOverview {
  totalSessions: number;
  totalMembers: number;
  overallRate: number;
}

export interface SessionAttendanceRow {
  sessionId: string;
  title: string;
  heldOn: string;
  attendeeCount: number;
  rate: number;
}

export interface MemberAttendanceRanking {
  memberId: string;
  displayName: string;
  attendedCount: number;
  rate: number;
}

export type SectionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface AttendanceDashboardSectionsProps {
  readonly overviewResult: SectionResult<AttendanceOverview>;
  readonly bySessionResult: SectionResult<SessionAttendanceRow[]>;
  readonly rankingResult: SectionResult<MemberAttendanceRanking[]>;
}

const fmtPct = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

function toneForRate(rate: number): KpiTone {
  if (rate >= 0.7) return "success";
  if (rate >= 0.5) return "warning";
  return "danger";
}

const bySessionColumns: AdminTableColumn<SessionAttendanceRow>[] = [
  { key: "heldOn", header: "開催日", accessor: (r) => r.heldOn, sortable: true, align: "left" },
  { key: "title", header: "タイトル", accessor: (r) => r.title, sortable: true, align: "left" },
  {
    key: "attendeeCount",
    header: "出席者数",
    accessor: (r) => r.attendeeCount,
    sortable: true,
    align: "right",
  },
  {
    key: "rate",
    header: "出席率",
    accessor: (r) => r.rate,
    render: (r) => fmtPct(r.rate),
    sortable: true,
    align: "right",
  },
];

const rankingColumns: AdminTableColumn<MemberAttendanceRanking>[] = [
  {
    key: "displayName",
    header: "会員",
    accessor: (r) => r.displayName || r.memberId,
    sortable: true,
    align: "left",
  },
  {
    key: "attendedCount",
    header: "出席数",
    accessor: (r) => r.attendedCount,
    sortable: true,
    align: "right",
  },
  {
    key: "rate",
    header: "出席率",
    accessor: (r) => r.rate,
    render: (r) => fmtPct(r.rate),
    sortable: true,
    align: "right",
  },
];

export function AttendanceDashboardSections({
  overviewResult,
  bySessionResult,
  rankingResult,
}: AttendanceDashboardSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {overviewResult.ok ? (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          role="group"
          aria-label="出席サマリー"
          data-testid="attendance-overview"
        >
          <KpiCard
            label="総セッション数"
            value={overviewResult.data.totalSessions}
            testId="attendance-kpi-total-sessions"
          />
          <KpiCard
            label="対象会員数"
            value={overviewResult.data.totalMembers}
            testId="attendance-kpi-total-members"
          />
          <KpiCard
            label="全体出席率"
            value={Math.round(overviewResult.data.overallRate * 1000) / 10}
            hint="%"
            tone={toneForRate(overviewResult.data.overallRate)}
            testId="attendance-kpi-overall-rate"
          />
        </div>
      ) : (
        <AdminSectionErrorClient
          sectionLabel="出席サマリー"
          code={overviewResult.error.code}
          message={overviewResult.error.message}
        />
      )}

      <section data-testid="attendance-by-session" aria-label="セッション別出席状況">
        {!bySessionResult.ok ? (
          <AdminSectionErrorClient
            sectionLabel="セッション別出席状況"
            code={bySessionResult.error.code}
            message={bySessionResult.error.message}
          />
        ) : bySessionResult.data.length === 0 ? (
          <AdminEmptyState
            title="セッション別出席データがありません"
            className="attendance-by-session-empty"
          />
        ) : (
          <AdminTable<SessionAttendanceRow>
            columns={bySessionColumns}
            rows={bySessionResult.data}
            getRowKey={(r) => r.sessionId}
            defaultSort={{ key: "heldOn", order: "desc" }}
            caption="セッション別出席状況"
          />
        )}
      </section>

      <section data-testid="attendance-ranking" aria-label="会員別出席ランキング">
        {!rankingResult.ok ? (
          <AdminSectionErrorClient
            sectionLabel="会員別出席ランキング"
            code={rankingResult.error.code}
            message={rankingResult.error.message}
          />
        ) : rankingResult.data.length === 0 ? (
          <AdminEmptyState
            title="会員別出席データがありません"
            className="attendance-ranking-empty"
          />
        ) : (
          <AdminTable<MemberAttendanceRanking>
            columns={rankingColumns}
            rows={rankingResult.data}
            getRowKey={(r) => r.memberId}
            defaultSort={{ key: "rate", order: "desc" }}
            caption="会員別出席ランキング"
          />
        )}
      </section>
    </div>
  );
}
