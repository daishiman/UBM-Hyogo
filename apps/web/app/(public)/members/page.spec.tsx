import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MembersPage from "./page";
import { listMembers } from "../../../src/lib/api/public";

vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/members",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../../src/lib/api/public", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/lib/api/public")>();
  return {
    ...actual,
    listMembers: vi.fn(),
  };
});

const mockedListMembers = vi.mocked(listMembers);

afterEach(() => cleanup());

describe("MembersPage safe fetch degrade", () => {
  beforeEach(() => mockedListMembers.mockReset());

  it("renders filters and SectionError when listMembers fails", async () => {
    mockedListMembers.mockRejectedValueOnce(
      new Error("fetchPublic failed: /public/members 503"),
    );

    render(
      await MembersPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("search")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain(
      "メンバー一覧を読み込めませんでした",
    );
    expect(screen.getByText("メンバー件数を読み込めませんでした")).toBeDefined();
  });

  it("propagates totalCount and displayedCount to MemberFilters live region", async () => {
    mockedListMembers.mockResolvedValueOnce({
      items: Array.from({ length: 10 }).map((_, i) => ({
        memberId: `m-${i}`,
        fullName: `Member ${i}`,
        nickname: null,
        occupation: null,
        location: null,
        ubmZone: null,
        ubmMembershipType: null,
        tags: [],
      })) as never,
      pagination: { total: 10, page: 1, perPage: 24 } as never,
      topTags: [],
    } as never);

    render(
      await MembersPage({
        searchParams: Promise.resolve({}),
      }),
    );

    const live = screen.getByRole("status");
    expect(live.textContent ?? "").toMatch(/10 件中 10 件/);
  });

  it("marks pagination-meta as aria-hidden machine-readable", async () => {
    mockedListMembers.mockResolvedValueOnce({
      items: [],
      pagination: { total: 0, page: 1, perPage: 24 } as never,
      topTags: [],
    } as never);

    const { container } = render(
      await MembersPage({
        searchParams: Promise.resolve({}),
      }),
    );
    const meta = container.querySelector('[data-role="pagination-meta"]');
    expect(meta?.getAttribute("aria-hidden")).toBe("true");
  });
});
