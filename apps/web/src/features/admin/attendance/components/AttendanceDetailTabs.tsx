"use client";

import { useState } from "react";
import type { MemberAttendanceRankingView, SessionAttendanceRowView } from "@ubm-hyogo/shared";
import { AdminSectionErrorClient } from "@/features/admin/components/_shared";
import type { SafeResult } from "@/lib/result";
import { Segmented } from "@/components/ui/Segmented";
import { AttendanceTop10Ranking } from "./AttendanceTop10Ranking";
import { MemberAttendanceTable } from "./MemberAttendanceTable";
import { SessionAttendanceTable } from "./SessionAttendanceTable";

type DetailTabKey = "session" | "member" | "top10";

interface Props {
  readonly bySession: SafeResult<readonly SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<readonly MemberAttendanceRankingView[]>;
}

const DETAIL_OPTIONS = [
  { value: "session", label: "セッション別" },
  { value: "member", label: "会員別" },
  { value: "top10", label: "TOP10" },
];

export function AttendanceDetailTabs({ bySession, ranking }: Props) {
  const [active, setActive] = useState<DetailTabKey>("session");

  return (
    <div className="attendance-detail-tabs" data-testid="attendance-detail-tabs">
      <Segmented
        ariaLabel="出席詳細の表示切替"
        className="attendance-detail-tabs__control"
        options={DETAIL_OPTIONS}
        value={active}
        onChange={(value) => setActive(value as DetailTabKey)}
      />
      <div className="attendance-detail-tabs__panel">
        {active === "session" ? (
          bySession.ok ? (
            <SessionAttendanceTable rows={bySession.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="セッション別出席状況"
              code={bySession.error.code}
              message={bySession.error.message}
            />
          )
        ) : null}
        {active === "member" ? (
          ranking.ok ? (
            <MemberAttendanceTable rows={ranking.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="会員別出席率"
              code={ranking.error.code}
              message={ranking.error.message}
            />
          )
        ) : null}
        {active === "top10" ? (
          ranking.ok ? (
            <AttendanceTop10Ranking rows={ranking.data} />
          ) : (
            <AdminSectionErrorClient
              sectionLabel="出席ランキング TOP 10"
              code={ranking.error.code}
              message={ranking.error.message}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
