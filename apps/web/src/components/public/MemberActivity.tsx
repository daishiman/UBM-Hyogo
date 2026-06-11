// task-12: section.key === "activity" を timeline 表示
// Lane B: SectionCard でラップ。data-section は SectionCard data-section 透過で維持（I-7）。
import type { z } from "zod";

import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { SectionCard } from "../ui/layout/SectionCard";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
type Field = Section["fields"][number];

export interface MemberActivityProps {
  sections: ReadonlyArray<Section>;
}

function renderValue(value: Field["value"]): string {
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function MemberActivity({ sections }: MemberActivityProps) {
  const activity = sections.find((s) => s.key === "activity");
  if (!activity || activity.fields.length === 0) return null;
  return (
    <SectionCard
      as="section"
      data-component="member-activity"
      data-section="activity"
      className="activity-root"
      title={activity.title}
    >
      <ol className="activity-timeline">
        {activity.fields.map((f) => (
          <li
            key={f.stableKey}
            data-stable-key={f.stableKey}
            className="activity-item"
          >
            <span className="activity-label">{f.label}</span>
            <span className="activity-value">{renderValue(f.value)}</span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
