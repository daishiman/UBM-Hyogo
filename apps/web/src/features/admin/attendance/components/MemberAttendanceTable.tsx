import type { MemberAttendanceRankingView } from "@ubm-hyogo/shared";
import { formatRate } from "../lib/format-attendance";

interface Props {
  readonly rows: readonly MemberAttendanceRankingView[];
}

export function MemberAttendanceTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="attendance-list-empty" data-testid="attendance-ranking-empty">
        メンバーデータがありません
      </p>
    );
  }
  return (
    <table
      className="attendance-member-table"
      data-testid="attendance-ranking-table"
    >
      <thead>
        <tr>
          <th scope="col">会員</th>
          <th scope="col">出席数</th>
          <th scope="col">出席率</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.memberId}>
            <td>{row.displayName || row.memberId}</td>
            <td>{row.attendedCount}</td>
            <td>{formatRate(row.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
