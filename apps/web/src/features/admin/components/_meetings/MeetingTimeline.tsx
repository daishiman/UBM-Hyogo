"use client";
import type { ReactNode } from "react";
import { AdminEmptyState } from "../_shared";
import type { MeetingItem } from "./meetingStats";

interface Props {
  readonly items: ReadonlyArray<MeetingItem>;
  readonly selectedId: string | null;
  readonly onSelect: (sessionId: string) => void;
  readonly renderRowExtra?: (item: MeetingItem) => ReactNode;
}

export function MeetingTimeline({ items, selectedId, onSelect, renderRowExtra }: Props) {
  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="開催日はまだありません"
        description="上のフォームから最初の開催日を追加してください"
        icon="calendar"
      />
    );
  }
  return (
    <ul role="list" className="admin-timeline flex flex-col gap-2">
      {items.map((m) => {
        const isSelected = selectedId === m.sessionId;
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
              >
                <span className="admin-timeline__date">{m.heldOn}</span>
                <span className="admin-timeline__title">{m.title}</span>
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
