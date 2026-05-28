"use client";
import { useState } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import type { MeetingItem } from "./meetingStats";

export interface MemberCandidate {
  memberId: string;
  fullName: string;
}

interface Props {
  readonly meeting: MeetingItem;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onAddAttendance: (memberId: string) => Promise<void> | void;
  readonly onRemoveAttendance: (memberId: string) => void;
  readonly onUpdateMeeting: (patch: {
    title: string;
    heldOn: string;
    note: string | null;
  }) => Promise<void> | void;
  readonly onSoftDelete: () => void;
}

export function MeetingAttendanceDrawer({
  meeting,
  candidates,
  attended,
  onAddAttendance,
  onRemoveAttendance,
  onUpdateMeeting,
  onSoftDelete,
}: Props) {
  const [picked, setPicked] = useState("");
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editHeldOn, setEditHeldOn] = useState(meeting.heldOn);
  const [editNote, setEditNote] = useState(meeting.note ?? "");
  const pickedAlreadyAttended = picked !== "" && attended.has(picked);

  return (
    <div className="admin-meeting-drawer flex flex-col gap-3" role="region" aria-label="出席編集">
      <details>
        <summary>編集</summary>
        <div className="flex flex-col gap-2">
          <FormField name={`meeting-edit-title-${meeting.sessionId}`} label="タイトル">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </FormField>
          <FormField name={`meeting-edit-heldOn-${meeting.sessionId}`} label="開催日">
            <Input
              type="date"
              value={editHeldOn}
              onChange={(e) => setEditHeldOn(e.target.value)}
            />
          </FormField>
          <FormField name={`meeting-edit-note-${meeting.sessionId}`} label="メモ">
            <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          </FormField>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="soft"
              onClick={() =>
                onUpdateMeeting({
                  title: editTitle,
                  heldOn: editHeldOn,
                  note: editNote.trim() || null,
                })
              }
            >
              更新
            </Button>
            <Button type="button" variant="danger" onClick={onSoftDelete}>
              開催日を削除
            </Button>
          </div>
        </div>
      </details>
      <div role="group" aria-label="出席追加" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          会員を選択
          <select
            data-testid={`attendance-select-${meeting.sessionId}`}
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className="ui-input"
          >
            <option value="">— 選択 —</option>
            {candidates.map((c) => (
              <option key={c.memberId} value={c.memberId} disabled={attended.has(c.memberId)}>
                {c.fullName} ({c.memberId})
                {attended.has(c.memberId) ? " — 出席済" : ""}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="primary"
          onClick={async () => {
            if (!picked) return;
            await onAddAttendance(picked);
            setPicked("");
          }}
          disabled={!picked || pickedAlreadyAttended}
          data-testid={`add-attendance-${meeting.sessionId}`}
        >
          出席を追加
        </Button>
      </div>
      {attended.size > 0 && (
        <div>
          <h4 className="text-sm font-semibold">出席者</h4>
          <ul className="flex flex-col gap-1">
            {[...attended].map((mid) => (
              <li
                key={mid}
                data-testid={`attendance-attendee-${meeting.sessionId}`}
                data-member={mid}
                className="flex items-center gap-2"
              >
                <span>{mid}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  data-testid={`remove-attendance-${meeting.sessionId}`}
                  data-member={mid}
                  onClick={() => onRemoveAttendance(mid)}
                >
                  削除
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
