// Lane B: SectionCard でラップ（パーソナル情報グループ）。
import type { NormalizedField } from "@/lib/adapters/member-detail";

import { SectionCard } from "../ui/layout/SectionCard";

export interface PersonalSectionProps {
  rows: ReadonlyArray<NormalizedField>;
}

function renderValue(value: NormalizedField["value"]): string {
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function PersonalSection({ rows }: PersonalSectionProps) {
  return (
    <SectionCard
      as="section"
      data-component="personal-section"
      className="stack-sm"
      title="パーソナル"
    >
      <p className="eyebrow">PERSONAL</p>
      <dl className="kv-list">
        {rows.map((row) => (
          <div
            key={row.stableKey}
            className="kv-row"
            data-stable-key={row.stableKey}
          >
            <dt className="kv-label">{row.label}</dt>
            <dd className="kv-value">{renderValue(row.value)}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
