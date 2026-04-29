import { describe, expect, it } from "vitest";

import { ApiError } from "@ubm-hyogo/shared/errors";

import { toPublicMemberProfile } from "../public-member-profile-view";
import type { VisibilityIndexEntry } from "../../../_shared/visibility-filter";

const schemaField = (
  stableKey: string,
  visibility: string,
  position = 0,
): VisibilityIndexEntry => ({
  stableKey,
  visibility,
  sectionKey: "basic",
  sectionTitle: "基本情報",
  label: stableKey,
  kind: "shortText",
  position,
});

describe("toPublicMemberProfile", () => {
  const baseSchema: VisibilityIndexEntry[] = [
    schemaField("fullName", "public", 0),
    schemaField("nickname", "public", 1),
    schemaField("location", "public", 2),
    schemaField("occupation", "public", 3),
    schemaField("ubmZone", "public", 4),
    schemaField("ubmMembershipType", "public", 5),
    schemaField("responseEmail", "internal", 6),
    schemaField("rulesConsent", "internal", 7),
    schemaField("adminNotes", "internal", 8),
    schemaField("phoneNumber", "member_only", 9),
  ];

  const baseFields = [
    { stableKey: "fullName", value: "山田太郎" },
    { stableKey: "nickname", value: "ヤマ" },
    { stableKey: "location", value: "Kobe" },
    { stableKey: "occupation", value: "Engineer" },
    { stableKey: "ubmZone", value: "0_to_1" },
    { stableKey: "ubmMembershipType", value: "member" },
    { stableKey: "responseEmail", value: "leak@example.com" },
    { stableKey: "rulesConsent", value: "yes" },
    { stableKey: "adminNotes", value: "internal note" },
    { stableKey: "phoneNumber", value: "090-0000-0000" },
  ];

  it("returns profile with public visibility fields only", () => {
    const result = toPublicMemberProfile({
      member: { memberId: "m-1" },
      status: {
        publicConsent: "consented",
        publishState: "public",
        isDeleted: false,
      },
      fields: baseFields,
      schemaFields: baseSchema,
      tags: [{ code: "ai", label: "AI", category: "skill" }],
    });
    expect(result.memberId).toBe("m-1");
    expect(result.summary.fullName).toBe("山田太郎");
    expect(result.summary.ubmZone).toBe("0_to_1");
    const flat = JSON.stringify(result);
    expect(flat).not.toContain("leak@example.com");
    expect(flat).not.toContain("internal note");
    expect(flat).not.toContain("090-0000-0000");
    expect(flat).not.toContain("responseEmail");
    expect(flat).not.toContain("rulesConsent");
    expect(flat).not.toContain("adminNotes");
  });

  it("throws UBM-1404 for declined consent (404 not 403)", () => {
    expect(() =>
      toPublicMemberProfile({
        member: { memberId: "m-2" },
        status: {
          publicConsent: "declined",
          publishState: "public",
          isDeleted: false,
        },
        fields: baseFields,
        schemaFields: baseSchema,
        tags: [],
      }),
    ).toThrow(ApiError);
  });

  it.each([
    ["hidden publish", { publicConsent: "consented", publishState: "hidden", isDeleted: false }],
    ["member_only publish", { publicConsent: "consented", publishState: "member_only", isDeleted: false }],
    ["deleted", { publicConsent: "consented", publishState: "public", isDeleted: true }],
    ["unknown consent", { publicConsent: "unknown", publishState: "public", isDeleted: false }],
  ])("rejects %s", (_label, status) => {
    expect(() =>
      toPublicMemberProfile({
        member: { memberId: "m-x" },
        status,
        fields: baseFields,
        schemaFields: baseSchema,
        tags: [],
      }),
    ).toThrow();
  });
});
