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

describe("fetchAdmin service binding transport", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    cloudflareContext.mockReset();
    cookies.mockReset();
    cookies.mockResolvedValue({ toString: () => "session=abc" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses env.API_SERVICE.fetch with the service-binding placeholder URL", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ ok: true }));
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, API_SERVICE: { fetch: bindingFetch } },
    });
    const globalFetch = vi.fn();
    vi.stubGlobal("fetch", globalFetch);

    await expect(fetchAdmin("/admin/dashboard")).resolves.toEqual({ ok: true });

    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
    const [url] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://service-binding.local/admin/dashboard");
  });

  it("sends the same admin headers and JSON body through service binding", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ ok: true }));
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, API_SERVICE: { fetch: bindingFetch } },
    });

    await fetchAdmin("/admin/members", {
      method: "POST",
      body: { memberId: "mem_001" },
    });

    const [, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
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

  it("keeps CF 1042 response body in the admin fetch error", async () => {
    const bindingFetch = vi.fn(async () => new Response("error code: 1042", { status: 404 }));
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, API_SERVICE: { fetch: bindingFetch } },
    });

    await expect(fetchAdmin("/admin/dashboard")).rejects.toThrow(
      "admin api /admin/dashboard failed: 404 body=error code: 1042",
    );
  });

  it("truncates long error bodies to 256 characters", async () => {
    const body = "x".repeat(300);
    const bindingFetch = vi.fn(async () => new Response(body, { status: 500 }));
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, API_SERVICE: { fetch: bindingFetch } },
    });

    await expect(fetchAdmin("/admin/dashboard")).rejects.toThrow(
      `admin api /admin/dashboard failed: 500 body=${"x".repeat(256)}`,
    );
  });
});
