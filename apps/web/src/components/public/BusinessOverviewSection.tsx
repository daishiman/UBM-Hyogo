import { STABLE_KEY } from "@ubm-hyogo/shared";

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
    <section
      data-component="business-overview"
      className="card-flat card-pad-lg stack-sm"
    >
      <p className="eyebrow">BUSINESS OVERVIEW</p>
      <h2 className="h-section">ビジネス概要</h2>
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
    </section>
  );
}
