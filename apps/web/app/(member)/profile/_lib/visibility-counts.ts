// workflow: mypage-prototype-alignment / Phase 5
// 純粋関数: profile.sections の field を visibility 別に集計する。
// 不変条件: API 変更ゼロ。GET /me/profile レスポンスのみから導出。
// 防御戦略 [WEEKGRD-02]: 未知 visibility 値は無視（例外を投げない）。

import type { MemberProfileSection } from "@ubm-hyogo/shared";

export interface VisibilityCounts {
  readonly public: number;
  readonly member: number;
  readonly admin: number;
}

export function deriveVisibilityCounts(
  sections: readonly MemberProfileSection[],
): VisibilityCounts {
  const counts: { public: number; member: number; admin: number } = {
    public: 0,
    member: 0,
    admin: 0,
  };
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.visibility === "public") counts.public += 1;
      else if (field.visibility === "member") counts.member += 1;
      else if (field.visibility === "admin") counts.admin += 1;
      // 未知値は無視（防御的）
    }
  }
  return counts;
}
