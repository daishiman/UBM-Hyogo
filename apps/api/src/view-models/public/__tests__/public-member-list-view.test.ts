import { describe, expect, it } from "vitest";

import { toPublicMemberListView } from "../public-member-list-view";

describe("toPublicMemberListView", () => {
  const baseAppliedQuery = {
    q: "",
    zone: "all",
    status: "member",
    tags: [],
    sort: "recent" as const,
    density: "comfy" as const,
  };

  it("strips forbidden keys at runtime", () => {
    const result = toPublicMemberListView({
      items: [
        {
          memberId: "m-1",
          fullName: "山田太郎",
          nickname: "ヤマ",
          occupation: "Eng",
          location: "Kobe",
          ubmZone: "0_to_1",
          ubmMembershipType: "member",
          // 仮にrepoがバグで漏れてきた場合の防御:
          ...({
            responseEmail: "leak@example.com",
            rulesConsent: "yes",
            adminNotes: "secret",
          } as Record<string, unknown>),
        } as never,
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false },
      appliedQuery: baseAppliedQuery,
      generatedAt: "2026-04-29T00:00:00+09:00",
    });
    const flat = JSON.stringify(result);
    expect(flat).not.toContain("leak@example.com");
    expect(flat).not.toContain("responseEmail");
    expect(flat).not.toContain("adminNotes");
    expect(flat).not.toContain("rulesConsent");
    expect(result.items).toHaveLength(1);
  });

  it("accepts empty list", () => {
    const result = toPublicMemberListView({
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false },
      appliedQuery: baseAppliedQuery,
      generatedAt: "2026-04-29T00:00:00+09:00",
    });
    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
