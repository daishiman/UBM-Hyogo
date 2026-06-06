import { describe, expect, it, vi } from "vitest";

import {
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

  it("allows localhost fallback only for local", () => {
    expect(resolveApiFetch({ environment: "local" })).toEqual({
      kind: "http",
      baseUrl: LOCAL_API_FALLBACK_BASE_URL,
    });
  });

  it("fails closed for staging without binding or baseUrl", () => {
    expect(() => resolveApiFetch({ environment: "staging" })).toThrow(/API transport unresolved/);
  });
});

describe("fetchViaApiTransport", () => {
  it("builds service-binding URL with fixed origin", async () => {
    const bindingFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    await fetchViaApiTransport({ kind: "service-binding", fetch: bindingFetch as unknown as typeof fetch }, "me");
    const calls = bindingFetch.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe(`${SERVICE_BINDING_ORIGIN}/me`);
  });
});
