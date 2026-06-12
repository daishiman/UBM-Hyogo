import { describe, expect, it, vi } from "vitest";

import {
  ApiTransportError,
  describeTransport,
  fetchViaApiTransport,
  LOCAL_API_FALLBACK_BASE_URL,
  resolveApiFetch,
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

  it("allows localhost fallback only for explicit local", () => {
    expect(resolveApiFetch({ environment: "local", environmentExplicit: true })).toEqual({
      kind: "http",
      baseUrl: LOCAL_API_FALLBACK_BASE_URL,
    });
  });

  it("fails closed when local is only an implicit default", () => {
    expect(() => resolveApiFetch({ environment: "local", environmentExplicit: false })).toThrow(
      /API transport unresolved/,
    );
  });

  it("fails closed for staging without binding or baseUrl", () => {
    expect(() => resolveApiFetch({ environment: "staging" })).toThrow(/API transport unresolved/);
  });
});

describe("describeTransport", () => {
  it("describes service binding without exposing a real backend URL", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(describeTransport({ kind: "service-binding", fetch: binding.fetch })).toEqual({
      transportKind: "service-binding",
      baseHost: "service-binding.local",
    });
  });

  it("describes http fallback by URL host", () => {
    expect(describeTransport({ kind: "http", baseUrl: "https://api.example.com/base" })).toEqual({
      transportKind: "http",
      baseHost: "api.example.com",
    });
  });
});

describe("fetchViaApiTransport", () => {
  it("builds service-binding URL with fixed origin", async () => {
    const bindingFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    await fetchViaApiTransport({ kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch }, "me");
    const calls = bindingFetch.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe(`${SERVICE_BINDING_ORIGIN}/me`);
  });

  it("wraps transport failures with descriptor diagnostics", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("network down");
    });
    await expect(
      fetchViaApiTransport(
        { kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch },
        "/me",
      ),
    ).rejects.toMatchObject({
      name: "ApiTransportError",
      transport: { transportKind: "service-binding", baseHost: "service-binding.local" },
    } satisfies Partial<ApiTransportError>);
  });
});
