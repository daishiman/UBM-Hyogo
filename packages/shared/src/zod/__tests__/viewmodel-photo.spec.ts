// issue-983 Phase 4/6: AdminMemberDetailViewZ.photoUrl の parse / strict 回帰テスト。
import { describe, it, expect } from "vitest";
import { AdminMemberDetailViewZ } from "../viewmodel";

const baseProfile = {
  memberId: "m_001",
  responseId: "r_001",
  responseEmail: "user1@example.com",
  publicConsent: "consented" as const,
  rulesConsent: "consented" as const,
  publishState: "public" as const,
  isDeleted: false,
  summary: {
    fullName: "田中太郎",
    nickname: "たなか",
    location: "神戸市",
    occupation: "経営者",
    ubmZone: null,
    ubmMembershipType: null,
  },
  sections: [],
  attendance: [],
  tags: [],
  lastSubmittedAt: "2026-05-01T00:00:00Z",
  editResponseUrl: null,
};

const baseView = {
  identityMemberId: "m_001",
  identityEmail: "user1@example.com",
  status: {
    publicConsent: "consented" as const,
    rulesConsent: "consented" as const,
    publishState: "public" as const,
    isDeleted: false,
    notificationOptOut: false,
  },
  profile: baseProfile,
  audit: [],
};

describe("AdminMemberDetailViewZ.photoUrl", () => {
  it("SCHEMA-P-1: photoUrl なしでも parse 成功（後方互換 = .strict() 維持）", () => {
    const result = AdminMemberDetailViewZ.safeParse(baseView);
    expect(result.success).toBe(true);
  });

  it("SCHEMA-P-2: 正しい url の photoUrl を受け入れる", () => {
    const result = AdminMemberDetailViewZ.safeParse({
      ...baseView,
      photoUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photoUrl).toBe("https://example.com/photo.jpg");
    }
  });

  it("SCHEMA-P-3: url 形式でない photoUrl は reject", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, photoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("SCHEMA-P-4: photoUrl: null は reject（optional だが型外）", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, photoUrl: null });
    expect(result.success).toBe(false);
  });

  it("SCHEMA-P-5: 未知フィールド unknownField は reject（.strict() 回帰）", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, unknownField: "x" });
    expect(result.success).toBe(false);
  });

  // --- Phase 6 拡充 ---
  it("SCHEMA-E-1: adminNote 未知フィールドで unrecognized_keys reject", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, adminNote: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe("unrecognized_keys");
    }
  });

  it("SCHEMA-E-2: photoUrl と未知フィールドの同時存在でも strict reject", () => {
    const result = AdminMemberDetailViewZ.safeParse({
      ...baseView,
      photoUrl: "https://r2.test/p.jpg",
      extra: 1,
    });
    expect(result.success).toBe(false);
  });

  it("SCHEMA-E-3: photoUrl が number なら reject", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, photoUrl: 12345 });
    expect(result.success).toBe(false);
  });

  // --- issue-1030: photoThumbUrl 拡張 ---
  it("SCHEMA-PT-1: photoThumbUrl なしでも parse 成功（後方互換）", () => {
    const result = AdminMemberDetailViewZ.safeParse(baseView);
    expect(result.success).toBe(true);
  });

  it("SCHEMA-PT-2: photoUrl と photoThumbUrl 双方の url を受け入れる", () => {
    const result = AdminMemberDetailViewZ.safeParse({
      ...baseView,
      photoUrl: "https://r2.test/display.webp",
      photoThumbUrl: "https://r2.test/thumb.webp",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photoThumbUrl).toBe("https://r2.test/thumb.webp");
    }
  });

  it("SCHEMA-PT-3: photoThumbUrl が url 形式でないなら reject", () => {
    const result = AdminMemberDetailViewZ.safeParse({
      ...baseView,
      photoThumbUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("SCHEMA-PT-4: photoThumbUrl: null は reject（optional だが型外）", () => {
    const result = AdminMemberDetailViewZ.safeParse({ ...baseView, photoThumbUrl: null });
    expect(result.success).toBe(false);
  });
});
