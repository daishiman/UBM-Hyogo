// 06b: profile.sections を読み取り専用で表示する Server Component。
// 不変条件 #1: stableKey 経由参照のみ（questionId への依存なし）。
// 不変条件 #4: 編集 form / input / textarea は配置しない。

import type { MemberProfileSection, MemberProfileSectionField } from "@ubm-hyogo/shared";

const renderValue = (value: MemberProfileSectionField["value"]): string => {
  if (value === null || value === undefined) return "（未回答）";
  if (Array.isArray(value)) return value.join(" / ");
  if (typeof value === "object") {
    // date オブジェクト
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
    <section aria-label="プロフィール情報">
      <h2>プロフィール情報</h2>
      {sections.map((section) => (
        <div key={section.key}>
          <h3>{section.title}</h3>
          <dl>
            {section.fields.map((field) => (
              <div key={field.stableKey}>
                <dt>{field.label}</dt>
                <dd>{renderValue(field.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
