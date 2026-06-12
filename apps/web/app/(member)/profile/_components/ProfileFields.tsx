// workflow: mypage-prototype-alignment / Phase 5 / ST-3
// Lane C: SectionCard + KVList へ移行（AC-4）。aria-label / data-region は I-7 保全。
// 不変条件 #1: stableKey 経由参照のみ（questionId 依存禁止）。
// 不変条件 #4: 編集 form / input / textarea は配置しない。

import type {
  MemberProfileSection,
  MemberProfileSectionField,
} from "@ubm-hyogo/shared";
import { KVList } from "@/components/ui/KVList";
import { SectionCard } from "@/components/ui/layout";

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
    <SectionCard
      title="プロフィール情報"
      aria-label="プロフィール情報"
      data-region="profile-fields"
    >
      {sections.map((section) => (
        <SectionCard key={section.key} padding="lg" as="div">
          <div className="eyebrow">{section.title}</div>
          <KVList
            items={section.fields.map((field) => ({
              key: field.label,
              value: renderValue(field.value),
            }))}
          />
        </SectionCard>
      ))}
    </SectionCard>
  );
}
