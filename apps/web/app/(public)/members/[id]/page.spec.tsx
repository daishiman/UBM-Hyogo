import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MemberDetailPage from "./page";
import {
  FetchPublicNotFoundError,
  fetchPublicOrNotFound,
} from "../../../../src/lib/fetch/public";

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("../../../../src/lib/fetch/public", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../src/lib/fetch/public")>();
  return {
    ...actual,
    fetchPublicOrNotFound: vi.fn(),
  };
});

const mockedFetchPublicOrNotFound = vi.mocked(fetchPublicOrNotFound);

afterEach(() => cleanup());

describe("MemberDetailPage safe fetch degrade", () => {
  beforeEach(() => {
    notFound.mockReset();
    mockedFetchPublicOrNotFound.mockReset();
  });

  it("renders SectionError for generic public fetch failures", async () => {
    mockedFetchPublicOrNotFound.mockRejectedValueOnce(
      new Error("fetchPublic failed: /public/members/m_1 503"),
    );

    render(await MemberDetailPage({ params: Promise.resolve({ id: "m_1" }) }));

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "メンバー情報を読み込めませんでした",
    );
  });

  it("keeps notFound for 404", async () => {
    mockedFetchPublicOrNotFound.mockRejectedValueOnce(
      new FetchPublicNotFoundError("/public/members/missing"),
    );

    await expect(
      MemberDetailPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
