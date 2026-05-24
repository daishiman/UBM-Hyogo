// workflow: mypage-prototype-alignment / Phase 5 / ST-3
// 役割: profile.sections を Card + KVList で section ごとに表示する Server Component。
// 不変条件 #1: stableKey 経由参照のみ（questionId 依存禁止）。
// 不変条件 #4: 編集 form / input / textarea は配置しない。
// 不変条件: 新規 primitive ゼロ（Card / KVList の合成）。

import type {
  MemberProfileSection,
  MemberProfileSectionField,
} from "@ubm-hyogo/shared";
import { Card } from "../../../src/components/ui/Card";
import { KVList } from "../../../src/components/ui/KVList";

const renderValue = (value: MemberProfileSectionField["value"]): string => {
  if (value === null || value === undefined) return "（未回答）";
  if (Array.isArray(value)) return value.join(" / ");
  if (typeof value === "object") {
    const { year, month, day } = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (typeof value === "boolean") return value ? "はい" : "いいえ";
  return String(value);
};

export interface ProfileFieldsProps {
  readonly sections: MemberProfileSection[];
}

export function ProfileFields({ sections }: ProfileFieldsProps) {
  return (
    <section
      aria-label="プロフィール情報"
      data-region="profile-fields"
    >
      <h2>プロフィール情報</h2>
      {sections.map((section) => (
        <Card key={section.key} className="card-pad-lg">
          <div className="eyebrow">{section.title}</div>
          <KVList
            items={section.fields.map((field) => ({
              key: field.label,
              value: renderValue(field.value),
            }))}
          />
        </Card>
      ))}
    </section>
  );
}
