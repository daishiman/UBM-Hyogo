// Lane B: SectionCard でラップ。
import { STABLE_KEY } from "@ubm-hyogo/shared";

import { SectionCard } from "../ui/layout/SectionCard";

export interface BusinessOverviewSectionProps {
  businessOverview: string;
  skills: string;
  canProvide: string;
}

export function BusinessOverviewSection({
  businessOverview,
  skills,
  canProvide,
}: BusinessOverviewSectionProps) {
  return (
    <SectionCard
      as="section"
      data-component="business-overview"
      className="stack-sm"
      title="ビジネス概要"
    >
      <p className="eyebrow">BUSINESS OVERVIEW</p>
      <p data-stable-key={STABLE_KEY.businessOverview}>
        {businessOverview.trim() || "—"}
      </p>
      {skills.trim() ? (
        <div data-stable-key={STABLE_KEY.skills}>
          <h3>できること・得意なこと</h3>
          <p>{skills}</p>
        </div>
      ) : null}
      {canProvide.trim() ? (
        <div data-stable-key={STABLE_KEY.canProvide}>
          <h3>提供できること</h3>
          <p>{canProvide}</p>
        </div>
      ) : null}
    </SectionCard>
  );
}
