import { describe, expect, it } from "vitest";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import {
  TEST_ACCOUNT_EMAIL_DOMAIN,
  isLoginableTestMember,
  isPublicListedTestMember,
  testAccountsCatalog,
} from "../catalog";

const PROFILE_KEYS = [
  STABLE_KEY.nickname,
  STABLE_KEY.location,
  STABLE_KEY.birthDate,
  STABLE_KEY.hometown,
  STABLE_KEY.ubmMembershipType,
  STABLE_KEY.ubmJoinDate,
  STABLE_KEY.businessOverview,
  STABLE_KEY.skills,
  STABLE_KEY.challenges,
  STABLE_KEY.canProvide,
  STABLE_KEY.hobbies,
  STABLE_KEY.recentInterest,
  STABLE_KEY.motto,
  STABLE_KEY.otherActivities,
  STABLE_KEY.urlWebsite,
  STABLE_KEY.urlFacebook,
  STABLE_KEY.urlInstagram,
  STABLE_KEY.urlThreads,
  STABLE_KEY.urlYoutube,
  STABLE_KEY.urlTiktok,
  STABLE_KEY.urlX,
  STABLE_KEY.urlBlog,
  STABLE_KEY.urlNote,
  STABLE_KEY.urlLinkedin,
  STABLE_KEY.urlOthers,
  STABLE_KEY.selfIntroduction,
] as const;

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
    expect(memberById("TEST-MEM-06").profile?.[STABLE_KEY.businessOverview]).toContain(
      "淡路島",
    );
    expect(memberById("TEST-MEM-10")).toMatchObject({
      publicConsent: "consented",
      publishState: "public",
      rulesConsent: "consented",
      isDeleted: false,
    });
    expect(memberById("TEST-MEM-10").profile?.[STABLE_KEY.selfIntroduction]).toContain(
      "'",
    );
  });

  it("fills every test member profile with all form profile stable keys", () => {
    for (const member of testAccountsCatalog.members) {
      expect(member.profile, member.memberId).toBeDefined();
      for (const stableKey of PROFILE_KEYS) {
        const value = member.profile?.[stableKey];
        expect(value, `${member.memberId}:${stableKey}`).toEqual(expect.any(String));
        expect(value?.trim().length, `${member.memberId}:${stableKey}`).toBeGreaterThan(0);
      }
    }
  });

  it("uses only canonical UBM zone and membership values in generated answers", () => {
    const zones = new Set(["0_to_1", "1_to_10", "10_to_100"]);
    const membershipTypes = new Set(["member", "non_member", "academy"]);

    for (const member of testAccountsCatalog.members) {
      expect(zones.has(member.ubmZone ?? ""), member.memberId).toBe(true);
      expect(
        membershipTypes.has(member.profile?.[STABLE_KEY.ubmMembershipType] ?? ""),
        member.memberId,
      ).toBe(true);
    }
  });
});
