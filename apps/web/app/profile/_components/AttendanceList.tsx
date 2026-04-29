// 06b: 参加履歴（read-only）。空配列時は EmptyState 風のメッセージを出す。

import type { MemberProfile } from "@ubm-hyogo/shared";

export interface AttendanceListProps {
  readonly attendance: MemberProfile["attendance"];
}

export function AttendanceList({ attendance }: AttendanceListProps) {
  if (attendance.length === 0) {
    return (
      <section aria-label="参加履歴">
        <h2>参加履歴</h2>
        <p data-state="empty">まだ参加履歴がありません。</p>
      </section>
    );
  }
  return (
    <section aria-label="参加履歴">
      <h2>参加履歴</h2>
      <ul>
        {attendance.map((item) => (
          <li key={item.sessionId}>
            <time dateTime={item.heldOn}>{item.heldOn}</time>
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
