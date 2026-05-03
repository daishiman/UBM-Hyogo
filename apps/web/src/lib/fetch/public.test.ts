// ut-05a-fetchpublic-service-binding-001 Phase 4 Layer 1
// AC-1: env.API_SERVICE が存在すれば service-binding 経由、無ければ HTTP fallback。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareEnv: { API_SERVICE?: { fetch: ReturnType<typeof vi.fn> }; PUBLIC_API_BASE_URL?: string } = {};

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: cloudflareEnv }),
}));

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  delete cloudflareEnv.API_SERVICE;
  delete cloudflareEnv.PUBLIC_API_BASE_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("fetchPublic / fetchPublicOrNotFound", () => {
  it("AC-1: env.API_SERVICE があれば binding.fetch を service-binding URL で呼ぶ", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const bindingFetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => jsonResponse(200, { ok: true }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch };
    const globalFetch = vi.fn(async () => jsonResponse(500, {}));
    vi.stubGlobal("fetch", globalFetch);

    const { fetchPublic } = await import("./public");
    const result = await fetchPublic<{ ok: boolean }>("/v1/members");

    expect(result.ok).toBe(true);
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
    const calledUrl = bindingFetch.mock.calls[0][0];
    expect(calledUrl).toBe("https://service-binding.local/v1/members");
    expect(logSpy).toHaveBeenCalledWith({
      transport: "service-binding",
      path: "/v1/members",
      status: 200,
    });
  });

  it("AC-1: env.API_SERVICE が無ければ globalThis.fetch を base URL で呼ぶ", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    cloudflareEnv.PUBLIC_API_BASE_URL = "https://api.example.test";
    const globalFetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => jsonResponse(200, { hello: "world" }),
    );
    vi.stubGlobal("fetch", globalFetch);

    const { fetchPublic } = await import("./public");
    const result = await fetchPublic<{ hello: string }>("/v1/ping");

    expect(result.hello).toBe("world");
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch.mock.calls[0][0]).toBe("https://api.example.test/v1/ping");
    expect(logSpy).toHaveBeenCalledWith({
      transport: "http-fallback",
      path: "/v1/ping",
      status: 200,
    });
  });

  it("AC-1: process.env.PUBLIC_API_BASE_URL も fallback として使用される", async () => {
    const prev = process.env.PUBLIC_API_BASE_URL;
    process.env.PUBLIC_API_BASE_URL = "https://process-env.example.test";
    const globalFetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => jsonResponse(200, {}),
    );
    vi.stubGlobal("fetch", globalFetch);

    try {
      const { fetchPublic } = await import("./public");
      await fetchPublic("/v1/x");
      expect(globalFetch.mock.calls[0][0]).toBe("https://process-env.example.test/v1/x");
    } finally {
      if (prev === undefined) delete process.env.PUBLIC_API_BASE_URL;
      else process.env.PUBLIC_API_BASE_URL = prev;
    }
  });

  it("非 OK 応答で例外を投げる", async () => {
    cloudflareEnv.API_SERVICE = { fetch: vi.fn(async () => jsonResponse(500, {})) };
    const { fetchPublic } = await import("./public");
    await expect(fetchPublic("/v1/err")).rejects.toThrow(/500/);
  });

  it("fetchPublicOrNotFound: 404 は FetchPublicNotFoundError を投げる", async () => {
    cloudflareEnv.API_SERVICE = { fetch: vi.fn(async () => jsonResponse(404, {})) };
    const mod = await import("./public");
    await expect(mod.fetchPublicOrNotFound("/v1/missing")).rejects.toBeInstanceOf(
      mod.FetchPublicNotFoundError,
    );
  });
});
