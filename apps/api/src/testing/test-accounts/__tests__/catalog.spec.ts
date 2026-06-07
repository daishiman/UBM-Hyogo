import { describe, expect, it } from "vitest";
import {
  TEST_ACCOUNT_EMAIL_DOMAIN,
  isLoginableTestMember,
  isPublicListedTestMember,
  testAccountsCatalog,
} from "../catalog";

describe("test accounts catalog", () => {
  const memberById = (memberId: string) => {
    const member = testAccountsCatalog.members.find((item) => item.memberId === memberId);
    if (!member) throw new Error(`missing test member: ${memberId}`);
    return member;
  };

  it("defines 10 members, 3 admins, and deterministic TEST markers", () => {
    expect(testAccountsCatalog.members).toHaveLength(10);
    expect(testAccountsCatalog.admins).toHaveLength(3);
    expect(testAccountsCatalog.meetings).toHaveLength(3);

    const ids = [
      ...testAccountsCatalog.members.map((member) => member.memberId),
      ...testAccountsCatalog.members.map((member) => member.responseId),
      ...testAccountsCatalog.admins.map((admin) => admin.adminId),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("TEST-"))).toBe(true);
    expect(
      [...testAccountsCatalog.members, ...testAccountsCatalog.admins].every((account) =>
        account.email.endsWith(`@${TEST_ACCOUNT_EMAIL_DOMAIN}`),
      ),
    ).toBe(true);
  });

  it("covers login and public visibility state space", () => {
    expect(testAccountsCatalog.members.filter(isLoginableTestMember)).toHaveLength(7);
    expect(testAccountsCatalog.members.filter(isPublicListedTestMember)).toHaveLength(5);
    expect(testAccountsCatalog.members.filter((member) => member.isDeleted)).toHaveLength(1);
    expect(testAccountsCatalog.admins.filter((admin) => admin.active)).toHaveLength(2);
  });

  it("keeps key member scenarios aligned with the workflow matrix", () => {
    expect(memberById("TEST-MEM-02")).toMatchObject({
      publicConsent: "declined",
      publishState: "member_only",
      rulesConsent: "consented",
      isDeleted: false,
    });
    expect(memberById("TEST-MEM-03")).toMatchObject({
      publicConsent: "consented",
      publishState: "hidden",
      rulesConsent: "consented",
      isDeleted: false,
    });
    expect(memberById("TEST-MEM-06")).toMatchObject({
      publicConsent: "consented",
      publishState: "public",
      rulesConsent: "consented",
      isDeleted: false,
      tags: [],
      attendance: [],
    });
    expect(memberById("TEST-MEM-10")).toMatchObject({
      publicConsent: "consented",
      publishState: "public",
      rulesConsent: "consented",
      isDeleted: false,
    });
  });
});
