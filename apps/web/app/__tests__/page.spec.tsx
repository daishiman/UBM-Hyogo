import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined),
}));

const baseStats = {
  members: { total: 0, byZone: { A: 0, B: 0, C: 0 } },
  recentMeetings: [],
};

const mockState = {
  members: { items: [] as Array<{ id: string }> },
};

vi.mock("../../src/lib/api/public", () => ({
  PUBLIC_API_REVALIDATE: { stats: 60, members: 30 },
  getStats: vi.fn(async () => baseStats),
  listMembersRaw: vi.fn(async () => mockState.members),
}));

import HomePage from "../page";

afterEach(() => {
  cleanup();
  mockState.members = { items: [] };
});

describe("HomePage", () => {
  it("MemberGrid がない場合も CallToActionCTA が main の最終 [data-component] として描画される", async () => {
    mockState.members = { items: [] };
    const { container } = render(await HomePage());
    const sections = Array.from(
      container.querySelectorAll("main [data-component]"),
    );
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.at(-1)?.getAttribute("data-component")).toBe(
      "call-to-action-cta",
    );
  });

  it("MemberGrid がある場合は CallToActionCTA が featured-members の後に描画される", async () => {
    mockState.members = {
      items: [
        {
          memberId: "m1",
          fullName: "テスト 太郎",
          nickname: "taro",
          occupation: "Founder",
          location: "Hyogo",
          ubmZone: "0→1",
          ubmMembershipType: "public",
        } as unknown as { id: string },
      ],
    };
    const { container } = render(await HomePage());
    const sections = Array.from(
      container.querySelectorAll("[data-component]"),
    );
    const idx = (name: string) =>
      sections.findIndex(
        (el) => el.getAttribute("data-component") === name,
      );
    expect(idx("featured-members")).toBeGreaterThanOrEqual(0);
    expect(idx("call-to-action-cta")).toBeGreaterThan(idx("featured-members"));
  });
});
