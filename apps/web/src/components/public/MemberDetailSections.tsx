// task-12: 公開会員詳細の publicSections を <section data-section> + KVList で展開する
// 不変条件 #1: 全 KV row に data-stable-key を必ず付与する
// 不変条件 #5: API 経由のみで取得した shape をそのまま render する
import type { z } from "zod";

import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
type Field = Section["fields"][number];

export interface MemberDetailSectionsProps {
  sections: ReadonlyArray<Section>;
}

function renderValue(value: Field["value"]): string {
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function MemberDetailSections({ sections }: MemberDetailSectionsProps) {
  return (
    <>
      {sections.map((section) => {
        const visibleFields = section.fields.filter((f) => f.kind !== "url");
        if (visibleFields.length === 0) return null;
        return (
          <section
            key={section.key}
            data-section={section.key}
            className="detail-section"
          >
            <h2 className="detail-section-title">{section.title}</h2>
            <dl className="kv-list">
              {visibleFields.map((field) => (
                <div
                  key={field.stableKey}
                  className="kv-row"
                  data-stable-key={field.stableKey}
                  data-visibility={field.visibility}
                >
                  <dt className="kv-label">{field.label}</dt>
                  <dd className="kv-value">{renderValue(field.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </>
  );
}
