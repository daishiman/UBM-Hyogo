import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "../page";
import { getAuthView } from "../../src/lib/auth-view";

vi.mock("next/server", () => ({ connection: vi.fn() }));

vi.mock("../../src/lib/api/public", () => ({
  PUBLIC_API_REVALIDATE: { stats: 60, members: 60 },
  getStats: vi.fn(async () => ({
    totalMembers: 0,
    publishedMembers: 0,
    recentMeetings: [],
  })),
  listMembersRaw: vi.fn(async () => ({ items: [] })),
}));

vi.mock("../../src/lib/auth-view", () => ({
  getAuthView: vi.fn(),
}));

vi.mock("../../src/components/public/PublicHeader", () => ({
  PublicHeader: ({
    authView,
  }: {
    authView: { kind: "guest" | "member" | "admin" };
  }) => <header data-auth-state={authView.kind} data-testid="public-header" />,
}));

vi.mock("../../src/components/public/PublicFooter", () => ({
  PublicFooter: () => <footer data-testid="public-footer" />,
}));

vi.mock("../../src/components/public/Hero", () => ({
  Hero: () => <section data-testid="hero" />,
}));

vi.mock("../../src/components/public/Stats", () => ({
  Stats: () => <section data-testid="stats" />,
}));

vi.mock("../../src/components/public/AboutUbm", () => ({
  AboutUbm: () => <section data-testid="about" />,
}));

vi.mock("../../src/components/public/MemberGrid", () => ({
  MemberGrid: () => <section data-testid="member-grid" />,
}));

vi.mock("../../src/components/public/Timeline", () => ({
  Timeline: () => <section data-testid="timeline" />,
}));

vi.mock("../../src/components/public/CallToActionCTA", () => ({
  CallToActionCTA: () => <section data-testid="cta" />,
}));

vi.mock("../../src/components/feedback/EmptyState", () => ({
  EmptyState: () => <section data-testid="empty" />,
}));

const mockedGetAuthView = vi.mocked(getAuthView);

afterEach(() => cleanup());

describe("HomePage PublicHeader authView wiring", () => {
  beforeEach(() => {
    mockedGetAuthView.mockReset();
  });

  it("guest authView を PublicHeader に渡す", async () => {
    mockedGetAuthView.mockResolvedValueOnce({ kind: "guest" });

    render(await HomePage());

    expect(mockedGetAuthView).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe(
      "guest",
    );
  });

  it("member authView を PublicHeader に渡す", async () => {
    mockedGetAuthView.mockResolvedValueOnce({
      kind: "member",
      profileHref: "/profile",
    });

    render(await HomePage());

    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe(
      "member",
    );
  });
});
