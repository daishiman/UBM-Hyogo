import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, render } from "@testing-library/react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";
import { MemberDrawer } from "../_members/MemberDrawer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const detail: AdminMemberDetailView = {
  identityMemberId: asMemberId("member/@id 01"),
  identityEmail: asResponseEmail("member@example.com"),
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  profile: {
    memberId: asMemberId("member/@id 01"),
    responseId: asResponseId("response-1"),
    responseEmail: asResponseEmail("member@example.com"),
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    summary: {
      fullName: "山田 太郎",
      nickname: "",
      location: "兵庫",
      occupation: "",
      ubmZone: "播磨",
      ubmMembershipType: null,
    },
    sections: [],
    attendance: [],
    tags: [],
    lastSubmittedAt: "2026-05-15T00:00:00.000Z",
    editResponseUrl: null,
  },
  audit: [],
};

describe("MemberDrawer", () => {
  it("会員ごとのタグ管理リンクを percent-encoded href で表示する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => detail,
    } as Response);

    render(<MemberDrawer memberId="member/@id 01" onClose={() => {}} />);

    const link = await screen.findByRole("link", { name: "タグ管理へ" });
    expect(link.getAttribute("href")).toBe("/admin/tags?memberId=member%2F%40id%2001");
    expect(link.className).toContain("text-[var(--ubm-color-accent)]");
    expect(link.className).toContain("focus-visible:outline-[var(--ubm-color-accent)]");

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/members/member%2F%40id%2001", {
        cache: "no-store",
      });
    });
  });
});
