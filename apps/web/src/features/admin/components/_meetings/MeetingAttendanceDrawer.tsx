"use client";
import { useMemo, useState } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import type { MeetingItem } from "./meetingStats";
import { BulkAttendanceChecklist } from "./BulkAttendanceChecklist";
import { BulkAttendanceModal } from "./BulkAttendanceModal";

export interface MemberCandidate {
  memberId: string;
  fullName: string;
}

interface Props {
  readonly meeting: MeetingItem;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onAddAttendance: (memberId: string) => Promise<void> | void;
  readonly onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
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
  onBulkAddAttendance,
  onRemoveAttendance,
  onUpdateMeeting,
  onSoftDelete,
}: Props) {
  const [picked, setPicked] = useState("");
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editHeldOn, setEditHeldOn] = useState(meeting.heldOn);
  const [editNote, setEditNote] = useState(meeting.note ?? "");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const pickedAlreadyAttended = picked !== "" && attended.has(picked);
  const candidateNameById = useMemo(
    () => new Map(candidates.map((c) => [c.memberId, c.fullName])),
    [candidates],
  );

  return (
    <div className="admin-meeting-drawer" role="region" aria-label="出席編集">
      <details className="admin-detail-section">
        <summary className="admin-detail-section__title">編集</summary>
        <div className="admin-detail-section__body">
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
      <section role="group" aria-label="出席追加" className="admin-detail-section">
        <h4 className="admin-detail-section__title">出席を追加</h4>
        <div className="admin-detail-section__body">
          <div className="flex flex-wrap items-end gap-2">
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
        </div>
      </section>
      <BulkAttendanceChecklist
        sessionId={meeting.sessionId}
        candidates={candidates}
        attended={attended}
        onBulkAddAttendance={onBulkAddAttendance}
        onOpenModal={() => setBulkModalOpen(true)}
      />
      <BulkAttendanceModal
        open={bulkModalOpen}
        sessionId={meeting.sessionId}
        candidates={candidates}
        attended={attended}
        onClose={() => setBulkModalOpen(false)}
        onBulkAddAttendance={onBulkAddAttendance}
      />
      {attended.size > 0 && (
        <section className="admin-detail-section">
          <h4 className="admin-detail-section__title">出席者 ({attended.size}名)</h4>
          <ul className="admin-attendee-list">
            {[...attended].sort().map((mid) => {
              const fullName = candidateNameById.get(mid);
              return (
                <li
                  key={mid}
                  data-testid={`attendance-attendee-${meeting.sessionId}`}
                  data-member={mid}
                  className="admin-attendee-row"
                >
                  <span className="admin-attendee-row__name">
                    {fullName ?? mid}
                    {fullName ? <span className="text-xs text-muted">({mid})</span> : null}
                  </span>
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
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
