import { describe, expect, it, vi } from "vitest";

import {
  ApiTransportError,
  fetchViaApiTransport,
  fetchViaApiTransportChain,
  LOCAL_API_FALLBACK_BASE_URL,
  resolveApiFetch,
  resolveApiFetchChain,
  SERVICE_BINDING_ORIGIN,
} from "./transport";

describe("resolveApiFetch", () => {
  it("test runtime with baseUrl uses http before service binding", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(
      resolveApiFetch({
        API_SERVICE: binding,
        baseUrl: "https://mock.example.com/",
        environment: "staging",
        isTest: true,
      }),
    ).toEqual({ kind: "http", baseUrl: "https://mock.example.com" });
  });

  it("uses service binding when present outside test override", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(resolveApiFetch({ API_SERVICE: binding, baseUrl: "https://api.example.com" })).toEqual({
      kind: "service-binding",
      fetch: binding.fetch,
    });
  });

  it("uses configured http baseUrl when binding is absent", () => {
    expect(resolveApiFetch({ baseUrl: "https://api.example.com/" })).toEqual({
      kind: "http",
      baseUrl: "https://api.example.com",
    });
  });

  it("allows localhost fallback only for local", () => {
    expect(resolveApiFetch({ environment: "local" })).toEqual({
      kind: "http",
      baseUrl: LOCAL_API_FALLBACK_BASE_URL,
    });
  });

  it("fails closed for staging without binding or baseUrl", () => {
    expect(() => resolveApiFetch({ environment: "staging" })).toThrow(/API transport unresolved/);
  });

  it("builds a staging fallback chain from binding to internal and public http", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(
      resolveApiFetchChain({
        API_SERVICE: binding,
        baseUrl: "https://api.internal.example.com/",
        publicBaseUrl: "https://api.public.example.com/",
        environment: "staging",
      }),
    ).toEqual([
      { kind: "service-binding", fetch: binding.fetch },
      { kind: "http", baseUrl: "https://api.internal.example.com" },
      { kind: "http", baseUrl: "https://api.public.example.com" },
    ]);
  });

  it("does not duplicate identical http fallback targets", () => {
    expect(
      resolveApiFetchChain({
        baseUrl: "https://api.example.com",
        publicBaseUrl: "https://api.example.com/",
        environment: "production",
      }),
    ).toEqual([{ kind: "http", baseUrl: "https://api.example.com" }]);
  });
});

describe("fetchViaApiTransport", () => {
  it("builds service-binding URL with fixed origin", async () => {
    const bindingFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    await fetchViaApiTransport({ kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch }, "me");
    const calls = bindingFetch.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe(`${SERVICE_BINDING_ORIGIN}/me`);
  });

  it("wraps transport-level throws with transport diagnostics", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("connection refused");
    });
    await expect(
      fetchViaApiTransport({ kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch }, "/me"),
    ).rejects.toMatchObject({
      name: "ApiTransportError",
      transportKind: "service-binding",
      baseHost: "service-binding.local",
    } satisfies Partial<ApiTransportError>);
  });
});

describe("fetchViaApiTransportChain", () => {
  it("falls back on GET transport errors only", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("binding down");
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const res = await fetchViaApiTransportChain(
        [
          { kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch },
          { kind: "http", baseUrl: "https://api.example.com" },
        ],
        "/me",
      );
      expect(res.status).toBe(200);
      expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.example.com/me");
      expect(warn).toHaveBeenCalledWith("api_transport_fallback", {
        from: { transportKind: "service-binding", baseHost: "service-binding.local" },
        to: { transportKind: "http", baseHost: "api.example.com" },
        path: "/me",
      });
    } finally {
      fetchSpy.mockRestore();
      warn.mockRestore();
    }
  });

  it("does not fall back on HTTP error responses", async () => {
    const bindingFetch = vi.fn(async () => new Response("down", { status: 503 }));
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const res = await fetchViaApiTransportChain(
        [
          { kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch },
          { kind: "http", baseUrl: "https://api.example.com" },
        ],
        "/me",
      );
      expect(res.status).toBe(503);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("does not fall back for non-idempotent methods", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("binding down");
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      await expect(
        fetchViaApiTransportChain(
          [
            { kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch },
            { kind: "http", baseUrl: "https://api.example.com" },
          ],
          "/me/delete-request",
          { method: "POST" },
        ),
      ).rejects.toBeInstanceOf(ApiTransportError);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
