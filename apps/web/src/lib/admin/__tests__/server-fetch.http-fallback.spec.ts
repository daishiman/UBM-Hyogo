import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareContext = vi.fn();
const cookies = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

import { fetchAdmin } from "../server-fetch";

const baseEnv = {
  ENVIRONMENT: "staging",
  NEXT_PUBLIC_API_BASE_URL: "https://web.example.test",
  PUBLIC_API_BASE_URL: "https://public.example.test",
  INTERNAL_API_BASE_URL: "https://api.example.test/",
  INTERNAL_AUTH_SECRET: "internal-secret",
  AUTH_URL: "https://web.example.test",
  SENTRY_ENVIRONMENT: "staging",
  SENTRY_TRACES_SAMPLE_RATE: "0.1",
};

describe("fetchAdmin HTTP fallback transport", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    cloudflareContext.mockReset();
    cookies.mockReset();
    cookies.mockResolvedValue({ toString: () => "session=abc" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses HTTP fetch when API_SERVICE is absent", async () => {
    cloudflareContext.mockReturnValue({ env: baseEnv });
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdmin("/admin/dashboard")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/admin/dashboard", {
      method: "GET",
      headers: {
        "x-internal-auth": "internal-secret",
        accept: "application/json",
        cookie: "session=abc",
      },
      cache: "no-store",
    });
  });

  it("prefers HTTP fetch in test when INTERNAL_API_BASE_URL is explicit even if binding exists", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("INTERNAL_API_BASE_URL", "https://mock-api.example.test");
    const bindingFetch = vi.fn();
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, API_SERVICE: { fetch: bindingFetch } },
    });
    const fetchMock = vi.fn(async () => Response.json({ mocked: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdmin("/admin/dashboard")).resolves.toEqual({ mocked: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bindingFetch).not.toHaveBeenCalled();
    const calls = fetchMock.mock.calls as unknown as [Parameters<typeof fetch>[0], RequestInit?][];
    expect(calls[0]?.[0]).toBe(
      "https://mock-api.example.test/admin/dashboard",
    );
  });

  it("sends admin headers and JSON body through HTTP fallback", async () => {
    cloudflareContext.mockReturnValue({ env: baseEnv });
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchAdmin("/admin/members", {
      method: "POST",
      body: { memberId: "mem_001" },
    });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({ memberId: "mem_001" }),
    });
    expect(init.headers).toEqual({
      "x-internal-auth": "internal-secret",
      accept: "application/json",
      cookie: "session=abc",
      "content-type": "application/json",
    });
  });
});
