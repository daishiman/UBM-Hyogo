import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MemberDetailPage, { generateMetadata } from "./page";
import * as envMod from "../../../../src/lib/env";
import {
  FetchPublicNotFoundError,
  fetchPublicOrNotFound,
} from "../../../../src/lib/fetch/public";
import { samplePublicMemberProfile } from "../../../../src/fixtures/public-member-profile";

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

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

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

  it("uses OG Worker URL and large Twitter card in member metadata", async () => {
    // resolvePublicEnv() は getPublicEnvSafe() 経由で ENVIRONMENT / NEXT_PUBLIC_API_BASE_URL も
    // 必須とするため、OG_IMAGE_BASE_URL のみの stubEnv では safeParse が失敗し DEFAULT_PUBLIC_ENV へ
    // フォールバックしてしまう。site-metadata.spec.ts と同じく getPublicEnvSafe を spy して解決する。
    vi.spyOn(envMod, "getPublicEnvSafe").mockReturnValue({
      ENVIRONMENT: "production",
      NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
      OG_IMAGE_BASE_URL: "https://og.example.test",
    });
    mockedFetchPublicOrNotFound.mockResolvedValueOnce(samplePublicMemberProfile);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "m_1" }),
    });

    const openGraph = metadata.openGraph as { images?: Array<{ url?: string }> };
    const twitter = metadata.twitter as { card?: string; images?: string[] };
    expect(openGraph.images?.[0]?.url).toBe("https://og.example.test/members/m_1");
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.images?.[0]).toBe("https://og.example.test/members/m_1");
  });
});
