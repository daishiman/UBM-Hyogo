import { describe, expect, it, vi } from "vitest";
import {
  resolveServiceBinding,
  selectAndFetch,
  stripTrailingSlash,
} from "../transport-select";

describe("transport-select", () => {
  it("keeps service binding when disableBinding is false", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(resolveServiceBinding({ binding, disableBinding: false })).toBe(
      binding,
    );
  });

  it("drops service binding when disableBinding is true", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(resolveServiceBinding({ binding, disableBinding: true })).toBe(
      undefined,
    );
  });

  it("removes one trailing slash from a base URL", () => {
    expect(stripTrailingSlash("https://api.example.test/")).toBe(
      "https://api.example.test",
    );
    expect(stripTrailingSlash("https://api.example.test")).toBe(
      "https://api.example.test",
    );
  });

  it("selects service binding before HTTP fallback and logs the response", async () => {
    const bindingFetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );
    const globalFetch = vi.fn();
    vi.stubGlobal("fetch", globalFetch);
    const log = vi.fn();

    const result = await selectAndFetch(
      {
        binding: { fetch: bindingFetch as unknown as typeof fetch },
        resolveBase: () => "https://api.example.test",
        log,
      },
      "/admin/members?x=1",
      { method: "POST" },
    );

    expect(result.kind).toBe("service-binding");
    expect(bindingFetch).toHaveBeenCalledWith(
      "https://service-binding.local/admin/members?x=1",
      { method: "POST" },
    );
    expect(globalFetch).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "service-binding",
      "/admin/members?x=1",
      201,
    );

    vi.unstubAllGlobals();
  });

  it("uses HTTP fallback when binding is unavailable", async () => {
    const globalFetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", globalFetch);
    const log = vi.fn();

    const result = await selectAndFetch(
      {
        binding: undefined,
        resolveBase: () => "https://api.example.test",
        log,
      },
      "/public/members",
      { method: "GET" },
    );

    expect(result.kind).toBe("http-fallback");
    expect(globalFetch).toHaveBeenCalledWith("https://api.example.test/public/members", {
      method: "GET",
    });
    expect(log).toHaveBeenCalledWith("http-fallback", "/public/members", 200);

    vi.unstubAllGlobals();
  });

  it("returns base-unavailable without calling fetch when fallback base is missing", async () => {
    const globalFetch = vi.fn();
    vi.stubGlobal("fetch", globalFetch);

    const result = await selectAndFetch(
      {
        binding: undefined,
        resolveBase: () => null,
      },
      "/admin/members",
      { method: "GET" },
    );

    expect(result).toEqual({ kind: "base-unavailable" });
    expect(globalFetch).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("propagates service binding fetch errors without logging", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new Error("binding boom");
    });
    const log = vi.fn();

    await expect(
      selectAndFetch(
        {
          binding: { fetch: bindingFetch as unknown as typeof fetch },
          resolveBase: () => "https://api.example.test",
          log,
        },
        "/admin/members",
        { method: "GET" },
      ),
    ).rejects.toThrow("binding boom");

    expect(log).not.toHaveBeenCalled();
  });

  it("propagates HTTP fallback fetch errors without logging", async () => {
    const globalFetch = vi.fn(async () => {
      throw new Error("network boom");
    });
    vi.stubGlobal("fetch", globalFetch);
    const log = vi.fn();

    await expect(
      selectAndFetch(
        {
          binding: undefined,
          resolveBase: () => "https://api.example.test",
          log,
        },
        "/public/members",
        { method: "GET" },
      ),
    ).rejects.toThrow("network boom");

    expect(log).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("propagates resolveBase errors without calling fetch", async () => {
    const globalFetch = vi.fn();
    vi.stubGlobal("fetch", globalFetch);

    await expect(
      selectAndFetch(
        {
          binding: undefined,
          resolveBase: () => {
            throw new Error("base boom");
          },
        },
        "/public/members",
        { method: "GET" },
      ),
    ).rejects.toThrow("base boom");

    expect(globalFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
