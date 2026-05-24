// workflow: mypage-prototype-alignment / Phase 5
// 純粋関数: profile.sections から ProfilePreview 表示用の displayName / subtitle / chips を抽出する。
// 不変条件 #6: stableKey 経由参照のみ（リテラル直書き禁止）。
// 防御戦略: 値が null/undefined/非文字列のときは "" に丸める（例外なし）。

import { STABLE_KEY, type MemberProfileSection } from "@ubm-hyogo/shared";

export interface ProfileSummaryChip {
  readonly label: string;
  readonly tone: "neutral";
}

export interface ProfileSummary {
  readonly displayName: string;
  readonly subtitle: string;
  readonly chips: readonly ProfileSummaryChip[];
}

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

export function pickProfileSummary(
  sections: readonly MemberProfileSection[],
): ProfileSummary {
  let displayName = "";
  let subtitle = "";
  const chipKeys: readonly string[] = [
    STABLE_KEY.nickname,
    STABLE_KEY.location,
    STABLE_KEY.ubmMembershipType,
  ];
  const chipValues: string[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      const key: string = field.stableKey;
      if (key === STABLE_KEY.fullName) {
        displayName = asString(field.value);
      } else if (key === STABLE_KEY.occupation) {
        subtitle = asString(field.value);
      } else if (chipKeys.includes(key)) {
        const v = asString(field.value);
        if (v.length > 0) chipValues.push(v);
      }
    }
  }

  const chips: readonly ProfileSummaryChip[] = chipValues.map((label) => ({
    label,
    tone: "neutral" as const,
  }));
  return { displayName, subtitle, chips };
}
