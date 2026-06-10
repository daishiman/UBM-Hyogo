"use client";

import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import type { MemberCandidate } from "./MeetingAttendanceDrawer";
import { useBulkAttendanceSelection } from "./useBulkAttendanceSelection";

interface Props {
  readonly sessionId: string;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
  readonly onOpenModal: () => void;
}

export function BulkAttendanceChecklist({
  sessionId,
  candidates,
  attended,
  onBulkAddAttendance,
  onOpenModal,
}: Props) {
  const selection = useBulkAttendanceSelection(candidates, attended);
  const selectedIds = [...selection.selectedIds];
  const selectableCount = candidates.filter((candidate) => !attended.has(candidate.memberId)).length;

  return (
    <section className="bulk-attendance" aria-label="出席者を一括追加">
      <div className="bulk-attendance__header">
        <h4>出席者を一括追加</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenModal}>
          人数が多い時はこちら
        </Button>
      </div>
      <FormField name={`bulk-attendance-search-${sessionId}`} label="会員検索">
        <Input
          value={selection.query}
          onChange={(event) => selection.setQuery(event.target.value)}
          placeholder="氏名または会員IDで検索"
        />
      </FormField>
      <div className="bulk-attendance__toolbar">
        <span className="text-sm text-muted">
          候補 {selection.selectableCandidates.length} / 未出席 {selectableCount}
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
      <div className="bulk-attendance__list" role="list">
        {selection.selectableCandidates.length === 0 ? (
          <p className="bulk-attendance__empty">追加できる会員がいません</p>
        ) : (
          selection.selectableCandidates.map((candidate) => (
            <Checkbox
              key={candidate.memberId}
              id={`bulk-attendance-${sessionId}-${candidate.memberId}`}
              checked={selection.selectedIds.has(candidate.memberId)}
              onChange={() => selection.toggle(candidate.memberId)}
              label={`${candidate.fullName} (${candidate.memberId})`}
            />
          ))
        )}
      </div>
      <div className="bulk-attendance__actions">
        <Button
          type="button"
          variant="primary"
          disabled={selectedIds.length === 0}
          data-testid={`bulk-add-attendance-${sessionId}`}
          onClick={async () => {
            const committed = await onBulkAddAttendance(selectedIds);
            if (committed) selection.clear();
          }}
        >
          選択した {selectedIds.length} 名を一括追加
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={selectedIds.length === 0}
          onClick={selection.clear}
        >
          選択解除
        </Button>
      </div>
    </section>
  );
}
