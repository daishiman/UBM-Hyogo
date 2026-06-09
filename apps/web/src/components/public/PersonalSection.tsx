import type { NormalizedField } from "@/lib/adapters/member-detail";

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
    <section
      data-component="personal-section"
      className="card-flat card-pad-lg stack-sm"
    >
      <p className="eyebrow">PERSONAL</p>
      <h2 className="h-section">パーソナル</h2>
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
    </section>
  );
}
