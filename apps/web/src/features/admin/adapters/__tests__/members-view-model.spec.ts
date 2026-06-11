// followup-001 T-5.2: members-view-model adapter spec
import { describe, expect, it } from "vitest";
import type { AdminMemberDetailView, AdminMemberListItem } from "@ubm-hyogo/shared";
import {
  deriveUpdatedAt,
  stringHashHue,
  toMemberDetail,
  toMemberListRow,
} from "../members-view-model";

const baseListItem = (overrides: Partial<AdminMemberListItem> = {}): AdminMemberListItem => ({
  memberId: "mem_alpha" as AdminMemberListItem["memberId"],
  responseEmail: "alpha@example.test" as AdminMemberListItem["responseEmail"],
  fullName: "青木 太郎",
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState: "public",
  isDeleted: false,
  lastSubmittedAt: "2026-05-11T00:00:00.000Z",
  pendingRequestTypes: [],
  ...overrides,
});

describe("members-view-model adapter (T-5.2)", () => {
  it("stringHashHue is deterministic and bounded to [0,360)", () => {
    const a1 = stringHashHue("mem_alpha");
    const a2 = stringHashHue("mem_alpha");
    expect(a1).toBe(a2);
    expect(a1).toBeGreaterThanOrEqual(0);
    expect(a1).toBeLessThan(360);
    expect(stringHashHue("mem_beta")).not.toBe(a1);
  });

  it("toMemberListRow joins tags and summary additively and falls back updatedAt", () => {
    const item = baseListItem();
    const tagStore = new Map([
      ["mem_alpha", [{ code: "t1", label: "kobe" }, { code: "t2", label: "founder" }]],
    ]);
    const row = toMemberListRow(item, { tagStore });
    expect(row.tags).toHaveLength(2);
    expect(row.updatedAt).toBe(item.lastSubmittedAt);
    expect(row.hue).toBe(stringHashHue(item.memberId));
    // additive: original fields preserved
    expect(row.fullName).toBe(item.fullName);
  });

  it("toMemberListRow uses summaryStore.updatedAt when present", () => {
    const item = baseListItem();
    const summaryStore = new Map([
      ["mem_alpha", { occupation: "経営者", ubmZone: "0_to_1", updatedAt: "2026-05-20T00:00:00.000Z" }],
    ]);
    const row = toMemberListRow(item, { summaryStore });
    expect(row.occupation).toBe("経営者");
    expect(row.ubmZone).toBe("0_to_1");
    expect(row.updatedAt).toBe("2026-05-20T00:00:00.000Z");
  });

  it("toMemberListRow returns empty tags array when tagStore is missing", () => {
    const row = toMemberListRow(baseListItem());
    expect(row.tags).toEqual([]);
  });

  it("deriveUpdatedAt picks max occurredAt from audit; fallback lastSubmittedAt when empty", () => {
    const view = {
      audit: [
        { occurredAt: "2026-05-01T00:00:00Z", actor: "admin", action: "x", note: null },
        { occurredAt: "2026-05-05T00:00:00Z", actor: "admin", action: "y", note: null },
      ],
      profile: { lastSubmittedAt: "2026-04-01T00:00:00Z" },
    } as unknown as AdminMemberDetailView;
    expect(deriveUpdatedAt(view)).toBe("2026-05-05T00:00:00Z");

    const empty = {
      audit: [],
      profile: { lastSubmittedAt: "2026-04-01T00:00:00Z" },
    } as unknown as AdminMemberDetailView;
    expect(deriveUpdatedAt(empty)).toBe("2026-04-01T00:00:00Z");
  });

  it("toMemberDetail derives responseId / summary / hue, and deleted meta when applicable", () => {
    const view = {
      identityMemberId: "mem_x",
      identityEmail: "x@example.test",
      status: {
        publicConsent: "consented",
        rulesConsent: "consented",
        publishState: "hidden",
        isDeleted: true,
        notificationOptOut: false,
      },
      profile: {
        memberId: "mem_x",
        responseId: "res_x",
        responseEmail: "x@example.test",
        publicConsent: "consented",
        rulesConsent: "consented",
        publishState: "hidden",
        isDeleted: true,
        summary: {
          fullName: "退会 花子",
          nickname: "",
          location: "Kobe",
          occupation: "経営者",
          ubmZone: "0_to_1",
          ubmMembershipType: "member",
        },
        sections: [],
        attendance: [],
        tags: [{ code: "t1", label: "kobe", category: "city", source: "admin" }],
        lastSubmittedAt: "2026-05-01T00:00:00Z",
        editResponseUrl: null,
      },
      audit: [
        { occurredAt: "2026-05-02T00:00:00Z", actor: "admin", action: "admin.member.deleted", note: "withdrawal" },
      ],
    } as unknown as AdminMemberDetailView;
    const detail = toMemberDetail(view);
    expect(detail.responseId).toBe("res_x");
    expect(detail.occupation).toBe("経営者");
    expect(detail.ubmZone).toBe("0_to_1");
    expect(detail.location).toBe("Kobe");
    expect(detail.tags).toHaveLength(1);
    expect(detail.deletedAt).toBe("2026-05-02T00:00:00Z");
    expect(detail.deletedReason).toBe("withdrawal");
    expect(detail.hue).toBe(stringHashHue("mem_x"));
    expect(detail.updatedAt).toBe("2026-05-02T00:00:00Z");
  });
});
