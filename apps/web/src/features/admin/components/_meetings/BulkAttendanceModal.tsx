"use client";

import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import { Modal } from "../../../../components/ui/Modal";
import type { MemberCandidate } from "./MeetingAttendanceDrawer";
import { useBulkAttendanceSelection } from "./useBulkAttendanceSelection";

interface Props {
  readonly open: boolean;
  readonly sessionId: string;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onClose: () => void;
  readonly onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
}

export function BulkAttendanceModal({
  open,
  sessionId,
  candidates,
  attended,
  onClose,
  onBulkAddAttendance,
}: Props) {
  const selection = useBulkAttendanceSelection(candidates, attended);
  const selectedIds = [...selection.selectedIds];

  return (
    <Modal open={open} onClose={onClose} title="出席者をまとめて選択">
      <div className="bulk-attendance-modal">
        <FormField name={`bulk-attendance-modal-search-${sessionId}`} label="会員検索">
          <Input
            value={selection.query}
            onChange={(event) => selection.setQuery(event.target.value)}
            placeholder="氏名または会員IDで検索"
            autoFocus
          />
        </FormField>
        <div className="bulk-attendance__toolbar">
          <span className="text-sm text-muted">
            表示 {selection.selectableCandidates.length} 件 / 選択 {selectedIds.length} 名
          </span>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={selection.selectAllFiltered}
            disabled={selection.selectableCandidates.length === 0}
          >
            表示中を全選択
          </Button>
        </div>
        <div className="bulk-attendance-modal__list" role="list">
          {selection.selectableCandidates.map((candidate) => (
            <Checkbox
              key={candidate.memberId}
              id={`bulk-attendance-modal-${sessionId}-${candidate.memberId}`}
              checked={selection.selectedIds.has(candidate.memberId)}
              onChange={() => selection.toggle(candidate.memberId)}
              label={`${candidate.fullName} (${candidate.memberId})`}
            />
          ))}
        </div>
        <div className="bulk-attendance__actions">
          <Button
            type="button"
            variant="primary"
            disabled={selectedIds.length === 0}
            onClick={async () => {
              const committed = await onBulkAddAttendance(selectedIds);
              if (committed) {
                selection.clear();
                onClose();
              }
            }}
          >
            選択した {selectedIds.length} 名を一括追加
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  );
}
