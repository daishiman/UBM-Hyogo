// task-11: public API wrapper のユニットテスト。
// 観点: getStats / listMembers query 構築 / strict parse / getMemberProfile not-found / getFormPreview。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareEnv: {
  API_SERVICE?: { fetch: typeof fetch };
  PUBLIC_API_BASE_URL?: string;
} = {};
const cloudflareContext = vi.fn(() => ({ env: cloudflareEnv }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import { z } from "zod";
import { PublicStatsViewZ } from "@ubm-hyogo/shared";

import {
  getFormPreview,
  getMemberProfile,
  getStats,
  listMembers,
} from "../public";
import { FetchPublicNotFoundError } from "../../fetch/public";
import { membersSearchSchema } from "../../url/members-search";
import {
  buildMember,
  buildStats,
} from "../../../test-utils/fixtures/public";
import {
  mockFetchOnce,
  restoreFetch,
} from "../../../test-utils/fetch-mock";

type PublicStatsView = z.infer<typeof PublicStatsViewZ>;

const reset = () => {
  delete cloudflareEnv.API_SERVICE;
  delete cloudflareEnv.PUBLIC_API_BASE_URL;
  cloudflareContext.mockImplementation(() => ({ env: cloudflareEnv }));
  delete process.env.PUBLIC_API_BASE_URL;
  process.env.PUBLIC_API_BASE_URL = "http://localhost:8787";
};

const baseListResponse = (
  overrides: Partial<{ items: ReturnType<typeof buildMember>[] }> = {},
) => ({
  items: overrides.items ?? [buildMember()],
  pagination: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  appliedQuery: {
    q: "",
    zone: "all",
    status: "all",
    tags: [],
    sort: "recent",
    density: "comfy",
  },
  generatedAt: "2026-05-09T00:00:00.000Z",
});

describe("public api wrapper", () => {
  beforeEach(reset);
  afterEach(() => {
    restoreFetch();
    reset();
  });

  it("getStats: schema strict parse を経由する", async () => {
    const stats = buildStats();
    mockFetchOnce({ body: stats, status: 200 });
    const result = await getStats();
    expect(result.memberCount).toBe(stats.memberCount);
  });

  it("getStats: 不正な schema は throw する", async () => {
    mockFetchOnce({ body: { memberCount: -1 }, status: 200 });
    await expect(getStats()).rejects.toThrow();
  });

  it("listMembers: 既定値を query に乗せず公開 endpoint を叩く", async () => {
    const fetchSpy = mockFetchOnce({ body: baseListResponse(), status: 200 });
    const search = membersSearchSchema.parse({});
    await listMembers(search);
    const [url] = fetchSpy.mock.calls[0] as unknown as [string];
    expect(url.endsWith("/public/members")).toBe(true);
  });

  it("listMembers: q / density / tag を query に展開する", async () => {
    const fetchSpy = mockFetchOnce({ body: baseListResponse(), status: 200 });
    const search = membersSearchSchema.parse({
      q: "山田",
      density: "list",
      tag: ["frontend", "kobe"],
    });
    await listMembers(search);
    const [url] = fetchSpy.mock.calls[0] as unknown as [string];
    expect(url).toContain("q=");
    expect(url).toContain("density=list");
    expect(url).toContain("tag=frontend");
    expect(url).toContain("tag=kobe");
  });

  it("getMemberProfile: 404 を FetchPublicNotFoundError に変換する", async () => {
    mockFetchOnce({ body: { error: "not found" }, status: 404 });
    await expect(getMemberProfile("missing")).rejects.toBeInstanceOf(
      FetchPublicNotFoundError,
    );
  });

  it("getFormPreview: strict parse OK", async () => {
    mockFetchOnce({
      body: {
        manifest: {
          formId: "f1",
          title: "テストフォーム",
          revisionId: "r1",
          schemaHash: "h1",
          state: "active",
          syncedAt: "2026-05-09T00:00:00.000Z",
          sourceUrl: "https://docs.google.com/forms/d/e/abc/viewform",
          fieldCount: 0,
          unknownFieldCount: 0,
        },
        fields: [],
        sectionCount: 0,
        fieldCount: 0,
        responderUrl: "https://example.com/forms/1",
      },
      status: 200,
    });
    const result = await getFormPreview();
    expect(result.responderUrl).toBe("https://example.com/forms/1");
  });
});
