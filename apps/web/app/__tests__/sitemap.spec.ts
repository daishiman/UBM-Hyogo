import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getEnvMock = vi.fn();

vi.mock("@/lib/env", () => ({
  getEnv: () => getEnvMock(),
}));

vi.mock("@/lib/seo/site-metadata", () => ({
  getSiteUrl: () => new URL("https://example.test"),
}));

import sitemap from "../sitemap";

type FetchInit = { headers?: Record<string, string> };

function stubFetch(): ReturnType<typeof vi.fn> {
  const spy = vi.fn(async (_url: string, _init?: FetchInit) => ({
    ok: true,
    json: async () => ({ items: [], pagination: { hasNext: false } }),
  }));
  Object.defineProperty(globalThis, "fetch", { value: spy, configurable: true });
  return spy as unknown as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("sitemap (C2 / AC-7, AC-8)", () => {
  beforeEach(() => {
    getEnvMock.mockReturnValue({
      INTERNAL_API_BASE_URL: "https://api.test",
      INTERNAL_AUTH_SECRET: "s3cr3t",
    });
  });

  it("TC-6-1: /public/members fetch に X-Internal-Auth を付与する", async () => {
    const spy = stubFetch();
    await sitemap();
    expect(spy).toHaveBeenCalled();
    const init = spy.mock.calls[0]?.[1] as FetchInit;
    expect(init.headers?.["X-Internal-Auth"]).toBe("s3cr3t");
  });

  it("TC-6-2: INTERNAL_AUTH_SECRET 未設定なら空文字を送る（throw しない）", async () => {
    getEnvMock.mockReturnValue({ INTERNAL_API_BASE_URL: "https://api.test" });
    const spy = stubFetch();
    await expect(sitemap()).resolves.toBeDefined();
    const init = spy.mock.calls[0]?.[1] as FetchInit;
    expect(init.headers?.["X-Internal-Auth"]).toBe("");
  });

  it("TC-6-3: env アクセサ getEnv 経由で値が流れる（process.env 直接参照しない）", async () => {
    stubFetch();
    await sitemap();
    expect(getEnvMock).toHaveBeenCalled();
  });
});
