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
});
