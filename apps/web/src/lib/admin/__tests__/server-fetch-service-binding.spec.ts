import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.fn();
const getPublicFetchEnv = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "session=mock" }),
}));

vi.mock("../../env", () => ({
  getEnv: () => getEnv(),
  getPublicFetchEnv: () => getPublicFetchEnv(),
}));

import { fetchAdmin } from "../server-fetch";

const baseEnv = {
  INTERNAL_API_BASE_URL: "https://ubm-hyogo-api-staging.daishimanju.workers.dev",
  INTERNAL_AUTH_SECRET: "secret",
};

describe("fetchAdmin service-binding transport", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    getEnv.mockReset();
    getPublicFetchEnv.mockReset();
    getEnv.mockReturnValue(baseEnv);
    getPublicFetchEnv.mockReturnValue({ NODE_ENV: "production" });
  });

  it("uses API_SERVICE.fetch outside test runtimes", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ ok: true }));
    getPublicFetchEnv.mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi.fn(async () => Response.json({ unexpected: true }));
    vi.stubGlobal("fetch", globalFetch);

    await expect(fetchAdmin("/admin/meetings")).resolves.toEqual({ ok: true });

    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
    const [url, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/meetings");
    expect((init.headers as Record<string, string>)["x-internal-auth"]).toBe("secret");
    expect((init.headers as Record<string, string>)["cookie"]).toBe("session=mock");
  });

  it("falls back to global fetch when API_SERVICE is absent", async () => {
    const globalFetch = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", globalFetch);

    await expect(fetchAdmin("/admin/meetings")).resolves.toEqual({ ok: true });

    expect(globalFetch).toHaveBeenCalledTimes(1);
    const [url] = globalFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/meetings",
    );
  });

  it("keeps HTTP fallback in NODE_ENV=test even when API_SERVICE is present", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ unexpected: true }));
    getPublicFetchEnv.mockReturnValue({
      NODE_ENV: "test",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", globalFetch);

    await expect(fetchAdmin("/admin/meetings")).resolves.toEqual({ ok: true });

    expect(bindingFetch).not.toHaveBeenCalled();
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps HTTP fallback in PLAYWRIGHT_TEST=1 even when API_SERVICE is present", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ unexpected: true }));
    getPublicFetchEnv.mockReturnValue({
      NODE_ENV: "production",
      PLAYWRIGHT_TEST: "1",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", globalFetch);

    await expect(fetchAdmin("/admin/meetings")).resolves.toEqual({ ok: true });

    expect(bindingFetch).not.toHaveBeenCalled();
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("preserves error body snippets on service-binding failures", async () => {
    const bindingFetch = vi.fn(async () => new Response("not found long body", { status: 404 }));
    getPublicFetchEnv.mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });

    await expect(fetchAdmin("/admin/meetings")).rejects.toThrow(
      /admin api \/admin\/meetings failed: 404 body=not found long body/,
    );
  });

  it("passes method, JSON body, and content-type through service-binding fetch", async () => {
    const bindingFetch = vi.fn(async () => Response.json({ ok: true }));
    getPublicFetchEnv.mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });

    await fetchAdmin("/admin/meetings", { method: "POST", body: { title: "x" } });

    const [, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "x" }));
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });
});
