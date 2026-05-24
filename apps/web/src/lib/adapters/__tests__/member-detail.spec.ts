// serial-06-form-response-binding: adapter unit spec (8 cases / branch coverage 100% 目標)
import { describe, expect, it } from "vitest";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { samplePublicMemberProfile } from "../../../fixtures/public-member-profile";
import { toMemberDetailProps } from "../member-detail";

describe("toMemberDetailProps", () => {
  it("fixture は PublicMemberProfileZ.parse を通過する", () => {
    expect(() =>
      PublicMemberProfileZ.parse(samplePublicMemberProfile),
    ).not.toThrow();
  });

  it("happy path: summary / attendance / tags をそのまま伝播する", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    expect(result.memberId).toBe(samplePublicMemberProfile.memberId);
    expect(result.summary).toEqual(samplePublicMemberProfile.summary);
    expect(result.attendance).toEqual(samplePublicMemberProfile.attendance);
    expect(result.tags).toEqual(samplePublicMemberProfile.tags);
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("visibility=member field を除外する", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    const all = result.sections.flatMap((s) => s.fields);
    expect(all.find((f) => f.stableKey === "responseEmail")).toBeUndefined();
  });

  it("visibility=admin のみで構成された section は丸ごと除外", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    expect(result.sections.find((s) => s.key === "consent")).toBeUndefined();
  });

  it("unknown kind を silent skip する", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) =
      "unknown_kind_xyz";
    const result = toMemberDetailProps(tampered);
    const basic = result.sections.find((s) => s.key === "basic");
    expect(basic?.fields.find((f) => f.stableKey === "fullName")).toBeUndefined();
    expect(basic?.fields.find((f) => f.stableKey === "nickname")).toBeDefined();
  });

  it("入力を mutate しない", () => {
    const snapshot = structuredClone(samplePublicMemberProfile);
    toMemberDetailProps(samplePublicMemberProfile);
    expect(samplePublicMemberProfile).toEqual(snapshot);
  });

  it("publicSections が空のとき sections === []", () => {
    const result = toMemberDetailProps({
      ...samplePublicMemberProfile,
      publicSections: [],
    });
    expect(result.sections).toEqual([]);
  });

  it("出力 field には visibility / source キーが含まれない", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    for (const section of result.sections) {
      for (const field of section.fields) {
        expect(field).not.toHaveProperty("visibility");
        expect(field).not.toHaveProperty("source");
      }
    }
  });
});
