import type { AttendanceAbsenteeList } from "@ubm-hyogo/shared";
import { attendanceFollowLevel } from "../lib/attendance-follow-level";
import { ZONE_LABEL } from "../lib/format-attendance";

interface Props {
  readonly data: AttendanceAbsenteeList;
}

export function AttendanceAbsenteeAlert({ data }: Props) {
  const followLevel = attendanceFollowLevel(data.rows.length);

  if (data.rows.length === 0) {
    return (
      <div
        className="attendance-absentee-summary"
        data-attendance-follow={followLevel}
        data-testid="attendance-absentee-empty"
      >
        <div className="attendance-kpi-label">要フォロー対象</div>
        <div className="attendance-absentee-count">0 名</div>
        <p>直近 {data.lastN} セッション連続欠席のメンバーはいません</p>
      </div>
    );
  }
  return (
    <details
      className="attendance-absentee-alert"
      data-attendance-follow={followLevel}
      data-testid="attendance-absentee-alert"
      open
    >
      <summary>
        <span className="attendance-kpi-label">要フォロー対象</span>
        <span className="attendance-absentee-count">{data.rows.length} 名</span>
        <span className="attendance-absentee-period">直近 {data.lastN} セッション連続欠席</span>
      </summary>
      <ul>
        {data.rows.slice(0, 50).map((row) => (
          <li key={row.memberId}>
            <span>{row.displayName || row.memberId}</span>
            <span>{ZONE_LABEL[row.zone]}</span>
            <span>欠席 {row.missedCount} 回</span>
            <span>
              最終出席: {row.lastAttendedAt ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
