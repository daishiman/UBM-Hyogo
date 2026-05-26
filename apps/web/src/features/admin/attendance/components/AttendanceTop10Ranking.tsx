import type { MemberAttendanceRankingView } from "@ubm-hyogo/shared";
import { formatRate } from "../lib/format-attendance";

interface Props {
  readonly rows: readonly MemberAttendanceRankingView[];
}

export function AttendanceTop10Ranking({ rows }: Props) {
  const top = rows.slice(0, 10);
  if (top.length === 0) {
    return <p data-testid="attendance-top10-empty">ランキングデータがありません</p>;
  }
  const maxCount = Math.max(1, ...top.map((r) => r.attendedCount));
  return (
    <ol className="attendance-top10" data-testid="attendance-top10">
      {top.map((row, idx) => (
        <li key={row.memberId} data-rank={idx + 1}>
          <span className="attendance-top10-rank">#{idx + 1}</span>
          <span className="attendance-top10-name">
            {row.displayName || row.memberId}
          </span>
          <span
            className="attendance-top10-bar"
            style={{ width: `${(row.attendedCount / maxCount) * 100}%` }}
            aria-hidden="true"
          />
          <span className="attendance-top10-count">
            {row.attendedCount} 回 / {formatRate(row.rate)}
          </span>
        </li>
      ))}
    </ol>
  );
}
