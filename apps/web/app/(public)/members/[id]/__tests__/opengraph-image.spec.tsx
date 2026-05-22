import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../../src/lib/fetch/public", () => ({
  fetchPublicOrNotFound: vi.fn(),
  FetchPublicNotFoundError: class FetchPublicNotFoundError extends Error {
    constructor(path: string) {
      super(`404 ${path}`);
      this.name = "FetchPublicNotFoundError";
    }
  },
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    headers: Map<string, string>;
    node: unknown;
    init: unknown;
    constructor(node: unknown, init?: unknown) {
      this.node = node;
      this.init = init;
      this.headers = new Map([["content-type", "image/png"]]);
    }
  },
}));

import * as ogModule from "../opengraph-image/route";
import { fetchPublicOrNotFound } from "../../../../../src/lib/fetch/public";
import { notFound } from "next/navigation";

describe("members/[id]/opengraph-image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ImageResponse with member name and occupation when profile exists", async () => {
    (
      fetchPublicOrNotFound as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      memberId: "m-1",
      summary: {
        fullName: "山田 太郎",
        nickname: "yamada",
        location: "神戸",
        occupation: "エンジニア",
        ubmZone: null,
        ubmMembershipType: null,
      },
      publicSections: [],
      attendance: [],
      tags: [],
    });

    const res = (await ogModule.GET(new Request("https://example.test"), {
      params: Promise.resolve({ id: "m-1" }),
    })) as unknown as { headers: Map<string, string>; node: unknown };
    expect(res).toBeDefined();
    expect(res.headers.get("content-type")).toContain("image/png");
    const rendered = JSON.stringify(res.node);
    expect(rendered).toContain("山田 太郎");
    expect(rendered).toContain("エンジニア");
    expect(rendered).toContain("Hyogo Branch Members");
  });

  it("omits occupation block when occupation is empty", async () => {
    (
      fetchPublicOrNotFound as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      memberId: "m-2",
      summary: {
        fullName: "佐藤 花子",
        nickname: "sato",
        location: "姫路",
        occupation: null,
        ubmZone: null,
        ubmMembershipType: null,
      },
      publicSections: [],
      attendance: [],
      tags: [],
    });

    const res = (await ogModule.GET(new Request("https://example.test"), {
      params: Promise.resolve({ id: "m-2" }),
    })) as unknown as { node: unknown };
    const rendered = JSON.stringify(res.node);
    expect(rendered).toContain("佐藤 花子");
    expect(rendered).not.toContain("エンジニア");
  });

  it("calls notFound when profile fetch raises FetchPublicNotFoundError", async () => {
    const err = new Error("not found");
    err.name = "FetchPublicNotFoundError";
    (
      fetchPublicOrNotFound as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(err);

    await expect(
      ogModule.GET(new Request("https://example.test"), {
        params: Promise.resolve({ id: "ghost" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-not-found errors", async () => {
    (
      fetchPublicOrNotFound as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("upstream 500"));
    await expect(
      ogModule.GET(new Request("https://example.test"), {
        params: Promise.resolve({ id: "x" }),
      }),
    ).rejects.toThrow("upstream 500");
    expect(notFound).not.toHaveBeenCalled();
  });
});
