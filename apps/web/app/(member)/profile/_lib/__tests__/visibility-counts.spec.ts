// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: _lib/visibility-counts.ts の純粋関数 deriveVisibilityCounts
// 操作対象: 全 external input（純粋関数のため state なし）

import { describe, it, expect } from "vitest";
import type {
  MemberProfileSection,
  MemberProfileSectionField,
} from "@ubm-hyogo/shared";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { deriveVisibilityCounts } from "../visibility-counts";

const makeField = (
  stableKey: string,
  visibility: MemberProfileSectionField["visibility"],
): MemberProfileSectionField => ({
  stableKey: stableKey as MemberProfileSectionField["stableKey"],
  label: stableKey,
  value: "x",
  kind: "shortText",
  visibility,
  source: "forms",
});

describe("deriveVisibilityCounts", () => {
  it("空配列のとき全件 0 を返す", () => {
    expect(deriveVisibilityCounts([])).toEqual({
      public: 0,
      member: 0,
      admin: 0,
    });
  });

  it("混在 visibility を正しく集計する", () => {
    const sections: MemberProfileSection[] = [
      {
        key: "s1",
        title: "S1",
        fields: [
          makeField(STABLE_KEY.fullName, "public"),
          makeField(STABLE_KEY.nickname, "public"),
          makeField(STABLE_KEY.location, "member"),
        ],
      },
      {
        key: "s2",
        title: "S2",
        fields: [makeField(STABLE_KEY.publicConsent, "admin")],
      },
    ];
    expect(deriveVisibilityCounts(sections)).toEqual({
      public: 2,
      member: 1,
      admin: 1,
    });
  });

  it("未知 visibility 値は無視し例外を投げない", () => {
    const sections: MemberProfileSection[] = [
      {
        key: "s",
        title: "S",
        fields: [
          makeField(STABLE_KEY.fullName, "public"),
          makeField(
            STABLE_KEY.nickname,
            "secret" as MemberProfileSectionField["visibility"],
          ),
        ],
      },
    ];
    expect(() => deriveVisibilityCounts(sections)).not.toThrow();
    expect(deriveVisibilityCounts(sections)).toEqual({
      public: 1,
      member: 0,
      admin: 0,
    });
  });

  it("section.fields が空でも 0 を返す", () => {
    const sections: MemberProfileSection[] = [
      { key: "s", title: "S", fields: [] },
    ];
    expect(deriveVisibilityCounts(sections)).toEqual({
      public: 0,
      member: 0,
      admin: 0,
    });
  });

  // Phase 6: 追加 fail path
  it("全 field が admin のとき admin のみ加算", () => {
    const fields = [
      makeField(STABLE_KEY.fullName, "admin"),
      makeField(STABLE_KEY.nickname, "admin"),
      makeField(STABLE_KEY.location, "admin"),
      makeField(STABLE_KEY.occupation, "admin"),
    ];
    expect(
      deriveVisibilityCounts([{ key: "s", title: "S", fields }]),
    ).toEqual({ public: 0, member: 0, admin: 4 });
  });

  it("複数の未知値が混在しても無視する", () => {
    const fields = [
      makeField(
        STABLE_KEY.fullName,
        "secret" as MemberProfileSectionField["visibility"],
      ),
      makeField(
        STABLE_KEY.nickname,
        "secret" as MemberProfileSectionField["visibility"],
      ),
      makeField(
        STABLE_KEY.location,
        "draft" as MemberProfileSectionField["visibility"],
      ),
      makeField(STABLE_KEY.occupation, "public"),
    ];
    expect(
      deriveVisibilityCounts([{ key: "s", title: "S", fields }]),
    ).toEqual({ public: 1, member: 0, admin: 0 });
  });

  it("visibility が undefined の field を無視する", () => {
    const fields = [
      makeField(
        STABLE_KEY.fullName,
        undefined as unknown as MemberProfileSectionField["visibility"],
      ),
      makeField(STABLE_KEY.nickname, "member"),
    ];
    expect(() =>
      deriveVisibilityCounts([{ key: "s", title: "S", fields }]),
    ).not.toThrow();
    expect(
      deriveVisibilityCounts([{ key: "s", title: "S", fields }]),
    ).toEqual({ public: 0, member: 1, admin: 0 });
  });
});
