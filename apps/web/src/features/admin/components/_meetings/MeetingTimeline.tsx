"use client";
import type { ReactNode } from "react";
import { AdminEmptyState } from "../_shared";
import { attendanceLevel, type MeetingItem } from "./meetingStats";

interface Props {
  readonly items: ReadonlyArray<MeetingItem>;
  readonly selectedId: string | null;
  readonly onSelect: (sessionId: string) => void;
  readonly getAttendanceCount?: (item: MeetingItem) => number;
  readonly renderRowExtra?: (item: MeetingItem) => ReactNode;
}

export function MeetingTimeline({
  items,
  selectedId,
  onSelect,
  getAttendanceCount,
  renderRowExtra,
}: Props) {
  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="開催日はまだありません"
        description="上のフォームで開催日を作成し、各回を開いて出席を記録してください"
        icon="calendar"
      />
    );
  }
  return (
    <ul role="list" className="admin-timeline flex flex-col gap-2">
      {items.map((m) => {
        const isSelected = selectedId === m.sessionId;
        const attendanceCount = getAttendanceCount?.(m) ?? m.attendance?.length ?? 0;
        const attendanceLabel = attendanceCount > 0 ? `${attendanceCount} 名出席` : "出席 未登録";
        return (
          <li
            key={m.sessionId}
            role="listitem"
            data-testid={`meeting-row-${m.sessionId}`}
            className="admin-timeline__row"
          >
            <article
              data-testid={`attendance-list-session-${m.sessionId}`}
              data-selected={isSelected || undefined}
              className="ui-card ui-card--flat"
            >
              <button
                type="button"
                className="admin-timeline__heading"
                onClick={() => onSelect(m.sessionId)}
                aria-expanded={isSelected}
                aria-label={`${m.title}（${m.heldOn}）の出席を記録・編集`}
              >
                <span className="admin-timeline__date">{m.heldOn}</span>
                <span className="admin-timeline__title">{m.title}</span>
                <span
                  className="ui-badge"
                  data-attendance-level={attendanceLevel(attendanceCount)}
                  data-testid={`meeting-attendance-count-${m.sessionId}`}
                >
                  {attendanceLabel}
                </span>
                <span className="sr-only">出席を記録・編集</span>
              </button>
              {m.note ? <p className="admin-timeline__note">{m.note}</p> : null}
              {renderRowExtra ? renderRowExtra(m) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
