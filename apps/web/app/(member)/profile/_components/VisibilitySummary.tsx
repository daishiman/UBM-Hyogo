// workflow: mypage-prototype-alignment / Phase 5 / ST-2
// Lane C: SectionCard へ移行（AC-4）。aria-label / data-region は I-7 保全。
// 不変条件: API 変更ゼロ（_lib/visibility-counts.ts の純粋関数のみで導出）。

import type { MemberProfileSection } from "@ubm-hyogo/shared";
import { Stat } from "@/components/ui/Stat";
import { SectionCard } from "@/components/ui/layout";
import { deriveVisibilityCounts } from "../_lib/visibility-counts";

export interface VisibilitySummaryProps {
  readonly sections: readonly MemberProfileSection[];
}

export function VisibilitySummary({ sections }: VisibilitySummaryProps) {
  const counts = deriveVisibilityCounts(sections);
  return (
    <SectionCard
      aria-label="公開範囲サマリ"
      data-region="visibility-summary"
      className="grid-3"
      tone="subtle"
    >
      <Stat label="PUBLIC" value={counts.public} helpText="公開中の項目" />
      <Stat label="MEMBERS" value={counts.member} helpText="会員のみに公開" />
      <Stat label="PRIVATE" value={counts.admin} helpText="管理者のみ閲覧" />
    </SectionCard>
  );
}
