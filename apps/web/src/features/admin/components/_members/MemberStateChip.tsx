"use client";
import type { PublishState } from "@ubm-hyogo/shared";
import { Chip } from "../../../../components/ui/Chip";
import type { ChipTone } from "../../../../lib/tones";

const TONE: Record<PublishState, ChipTone> = {
  public: "green",
  member_only: "amber",
  hidden: "stone",
};

const LABEL: Record<PublishState, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

export interface MemberStateChipRowProps {
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
}

export function MemberStateChipRow({ publishState, isDeleted }: MemberStateChipRowProps) {
  if (isDeleted) {
    return (
      <div className="flex flex-wrap gap-1.5" data-testid="member-state-chip-row">
        <Chip tone="red">退会</Chip>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="member-state-chip-row">
      <Chip tone={TONE[publishState]}>{LABEL[publishState]}</Chip>
    </div>
  );
}
