// task-c-public-member-sidebar-shell-integration: 移動した root `/` page の構造 guard (MV-1)。
// page は header/footer を持たず content (<main>) のみを返す（shell/layout が header/footer を所有）。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

vi.mock("../../src/lib/api/public", () => ({
  PUBLIC_API_REVALIDATE: { stats: 60, members: 60 },
  getStats: vi.fn(async () => ({
    totalMembers: 0,
    publicMembers: 0,
    meetingsCount: 0,
    recentMeetings: [],
  })),
  listMembersRaw: vi.fn(async () => ({ items: [] })),
}));

// 重い presentational セクションは stub 化し、page の構造（content-only）だけを検証する。
vi.mock("../../src/components/public/Hero", () => ({ Hero: () => <div data-testid="hero" /> }));
vi.mock("../../src/components/public/Stats", () => ({ Stats: () => <div /> }));
vi.mock("../../src/components/public/AboutUbm", () => ({ AboutUbm: () => <div /> }));
vi.mock("../../src/components/public/MemberGrid", () => ({ MemberGrid: () => <div /> }));
vi.mock("../../src/components/public/Timeline", () => ({ Timeline: () => <div /> }));
vi.mock("../../src/components/public/CallToActionCTA", () => ({
  CallToActionCTA: () => <div />,
}));
vi.mock("../../src/components/feedback/EmptyState", () => ({ EmptyState: () => <div /> }));

import HomePage from "./page";
import { getStats, listMembersRaw } from "../../src/lib/api/public";

afterEach(() => cleanup());

describe("(public)/page.tsx (移動後の root /)", () => {
  it("MV-1: content (<main data-page='home'>) を返し、header/footer を持たない", async () => {
    const { container } = render(await HomePage());
    expect(container.querySelector('main[data-page="home"]')).not.toBeNull();
    expect(container.querySelector('[data-component="public-header"]')).toBeNull();
    expect(container.querySelector('[data-component="public-footer"]')).toBeNull();
  });

  it("PUBLIC-DEGRADE-1: public API parse failure でも route error ではなく section error に降格する", async () => {
    vi.mocked(getStats).mockRejectedValueOnce(new Error("stats parse failed"));
    vi.mocked(listMembersRaw).mockRejectedValueOnce(new Error("members parse failed"));
    const { getByText } = render(await HomePage());
    expect(getByText("活動指標を読み込めませんでした")).toBeTruthy();
    expect(getByText("メンバー情報を読み込めませんでした")).toBeTruthy();
  });
});
