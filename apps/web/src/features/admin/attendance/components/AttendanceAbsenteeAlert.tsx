import type { AttendanceAbsenteeList } from "@ubm-hyogo/shared";
import { ZONE_LABEL } from "../lib/format-attendance";

interface Props {
  readonly data: AttendanceAbsenteeList;
}

export function AttendanceAbsenteeAlert({ data }: Props) {
  if (data.rows.length === 0) {
    return (
      <p data-testid="attendance-absentee-empty">
        直近 {data.lastN} セッション連続欠席のメンバーはいません
      </p>
    );
  }
  return (
    <details
      className="attendance-absentee-alert"
      data-testid="attendance-absentee-alert"
      open
    >
      <summary>
        要フォローアップ {data.rows.length} 名 (直近 {data.lastN} セッション)
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
