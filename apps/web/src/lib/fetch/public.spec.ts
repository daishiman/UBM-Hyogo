// ut-web-cov-03 Phase 5: fetch/public.ts unit test。
// 観点: service-binding 経路 / 直接 fetch 経路 / revalidate / 200 / 404(NotFound) / 5xx / network-fail。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareEnv: { API_SERVICE?: { fetch: typeof fetch }; PUBLIC_API_BASE_URL?: string } = {};
const cloudflareContext = vi.fn(() => ({ env: cloudflareEnv }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import {
  fetchPublic,
  fetchPublicOrNotFound,
  FetchPublicNotFoundError,
} from "./public";
import {
  mockFetchOnce,
  mockFetchNetworkError,
  restoreFetch,
} from "../../test-utils/fetch-mock";

const reset = () => {
  delete cloudflareEnv.API_SERVICE;
  delete cloudflareEnv.PUBLIC_API_BASE_URL;
  cloudflareContext.mockImplementation(() => ({ env: cloudflareEnv }));
  delete process.env.PUBLIC_API_BASE_URL;
};

describe("fetchPublic", () => {
  beforeEach(reset);
  afterEach(() => {
    restoreFetch();
    reset();
  });

  it("service-binding 経路: env.API_SERVICE.fetch を使う", async () => {
    const bindingFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };
    const r = await fetchPublic<{ ok: boolean }>("/health");
    expect(r).toEqual({ ok: true });
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    const [url, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate: number } }];
    expect(url).toBe("https://service-binding.local/health");
    expect((init as { next?: { revalidate: number } }).next).toEqual({
      revalidate: 30,
    });
  });

  it("PUBLIC_API_BASE_URL を使った外向き fetch", async () => {
    cloudflareEnv.PUBLIC_API_BASE_URL = "https://api.example.com";
    const spy = mockFetchOnce({ status: 200, body: { ok: 1 } });
    const r = await fetchPublic<{ ok: number }>("/v1/foo");
    expect(r).toEqual({ ok: 1 });
    expect(spy).toHaveBeenCalledWith(
      "https://api.example.com/v1/foo",
      expect.objectContaining({
        next: { revalidate: 30 },
      }),
    );
  });

  it("getCloudflareContext throw 時 process.env を fallback として使う", async () => {
    cloudflareContext.mockImplementation(() => {
      throw new Error("not in CF");
    });
    process.env.PUBLIC_API_BASE_URL = "https://process.example.com";
    const spy = mockFetchOnce({ status: 200, body: { ok: 2 } });
    const r = await fetchPublic<{ ok: number }>("/v1/bar");
    expect(r).toEqual({ ok: 2 });
    expect(spy.mock.calls[0]?.[0]).toBe("https://process.example.com/v1/bar");
  });

  it("PUBLIC_API_BASE_URL 未指定なら DEFAULT_BASE_URL", async () => {
    cloudflareContext.mockImplementation(() => {
      throw new Error("not in CF");
    });
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchPublic("/x");
    expect(spy.mock.calls[0]?.[0]).toBe("http://localhost:8787/x");
  });

  it("revalidate と headers を上書きできる", async () => {
    const bindingFetch = vi.fn(
      async () =>
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };
    await fetchPublic("/x", {
      revalidate: 60,
      headers: { "x-custom": "1" },
    });
    const [, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate: number } }];
    expect((init as { next?: { revalidate: number } }).next).toEqual({
      revalidate: 60,
    });
    expect((init.headers as Record<string, string>)["x-custom"]).toBe("1");
    expect((init.headers as Record<string, string>)["Accept"]).toBe(
      "application/json",
    );
  });

  it("非 2xx でエラー throw", async () => {
    cloudflareContext.mockImplementation(() => ({ env: {} }));
    mockFetchOnce({ status: 500, rawBody: "boom" });
    await expect(fetchPublic("/oops")).rejects.toThrow(/500/);
  });

  it("network 失敗時は素通しで throw", async () => {
    cloudflareContext.mockImplementation(() => ({ env: {} }));
    mockFetchNetworkError();
    await expect(fetchPublic("/oops")).rejects.toBeInstanceOf(TypeError);
  });
});

describe("fetchPublicOrNotFound", () => {
  beforeEach(reset);
  afterEach(() => {
    restoreFetch();
    reset();
  });

  it("200 で JSON を返す", async () => {
    cloudflareContext.mockImplementation(() => ({ env: {} }));
    mockFetchOnce({ status: 200, body: { id: 1 } });
    const r = await fetchPublicOrNotFound<{ id: number }>("/v1/x");
    expect(r).toEqual({ id: 1 });
  });

  it("404 で FetchPublicNotFoundError", async () => {
    cloudflareContext.mockImplementation(() => ({ env: {} }));
    mockFetchOnce({ status: 404, rawBody: "" });
    await expect(fetchPublicOrNotFound("/v1/missing")).rejects.toBeInstanceOf(
      FetchPublicNotFoundError,
    );
  });

  it("5xx で 通常 Error", async () => {
    cloudflareContext.mockImplementation(() => ({ env: {} }));
    mockFetchOnce({ status: 503, rawBody: "" });
    await expect(fetchPublicOrNotFound("/v1/x")).rejects.toThrow(/503/);
  });

  it("revalidate オプションを伝搬する", async () => {
    const bindingFetch = vi.fn(
      async () =>
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };
    await fetchPublicOrNotFound("/v1/x", { revalidate: 120 });
    const [, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate: number } }];
    expect((init as { next?: { revalidate: number } }).next).toEqual({
      revalidate: 120,
    });
  });
});
