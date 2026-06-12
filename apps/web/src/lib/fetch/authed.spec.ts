// ut-web-cov-03 Phase 5: fetch/authed.ts unit test。
// 観点: path 検証 / cookie 転送 / 200 / 401(AuthRequiredError) / 403/5xx(FetchAuthedError) / network-fail。

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieList: Array<{ name: string; value: string }> = [];
const mockGetAuthEnv = vi.hoisted(() => vi.fn());
const mockGetEnvironment = vi.hoisted(() => vi.fn());
const mockGetTransportRuntimeIsTest = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => cookieList,
  }),
}));
vi.mock("@/lib/env", () => ({
  getAuthEnv: mockGetAuthEnv,
  getEnvironment: mockGetEnvironment,
  getTransportRuntimeIsTest: mockGetTransportRuntimeIsTest,
}));

import {
  ApiTransportError,
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "./authed";
import {
  mockFetchOnce,
  mockFetchNetworkError,
  restoreFetch,
} from "../../test-utils/fetch-mock";

const setCookies = (...cs: Array<{ name: string; value: string }>) => {
  cookieList.length = 0;
  cookieList.push(...cs);
};

const makeEnv = (
  overrides: Partial<{
    INTERNAL_API_BASE_URL: string;
  }> = {},
) => ({
  ENVIRONMENT: "local",
  NEXT_PUBLIC_API_BASE_URL: "https://web.example.com",
  INTERNAL_API_BASE_URL: "https://api.example.com",
  ...overrides,
});

describe("fetchAuthed", () => {
  beforeEach(() => {
    setCookies();
    mockGetAuthEnv.mockReturnValue(makeEnv());
    mockGetEnvironment.mockReturnValue("local");
    mockGetTransportRuntimeIsTest.mockReturnValue(false);
  });
  afterEach(() => {
    restoreFetch();
    mockGetAuthEnv.mockReset();
    mockGetEnvironment.mockReset();
    mockGetTransportRuntimeIsTest.mockReset();
  });

  it("path が / で始まらない場合 throw", async () => {
    await expect(fetchAuthed("relative")).rejects.toThrow(
      /must start with '\/'/,
    );
  });

  it("200 で JSON を返し cookie を転送する", async () => {
    setCookies({ name: "session", value: "abc" }, { name: "csrf", value: "x" });
    const spy = mockFetchOnce({ status: 200, body: { id: 1 } });
    const r = await fetchAuthed<{ id: number }>("/me");
    expect(r).toEqual({ id: 1 });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/me");
    const headers = init.headers as Headers;
    expect(headers.get("cookie")).toBe("session=abc; csrf=x");
    expect(headers.get("accept")).toBe("application/json");
    expect(init.cache).toBe("no-store");
  });

  it("cookie が空のときは cookie ヘッダを付けない", async () => {
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchAuthed("/me");
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.has("cookie")).toBe(false);
  });

  it("401 で AuthRequiredError", async () => {
    mockFetchOnce({ status: 401, rawBody: "" });
    await expect(fetchAuthed("/me")).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("403 で FetchAuthedError(status=403)", async () => {
    mockFetchOnce({ status: 403, rawBody: "forbidden" });
    try {
      await fetchAuthed("/admin");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchAuthedError);
      expect((e as FetchAuthedError).status).toBe(403);
      expect((e as FetchAuthedError).bodyText).toBe("forbidden");
    }
  });

  it("500 で FetchAuthedError(status=500)", async () => {
    mockFetchOnce({ status: 500, rawBody: "boom" });
    try {
      await fetchAuthed("/oops");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FetchAuthedError);
      expect((e as FetchAuthedError).status).toBe(500);
    }
  });

  it("network failure は素通しで throw", async () => {
    mockFetchNetworkError();
    await expect(fetchAuthed("/me")).rejects.toBeInstanceOf(ApiTransportError);
  });

  it("INTERNAL_API_BASE_URL 末尾 / を取り除く", async () => {
    mockGetAuthEnv.mockReturnValue(
      makeEnv({ INTERNAL_API_BASE_URL: "https://api.example.com/" }),
    );
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchAuthed("/x");
    expect(spy.mock.calls[0]?.[0]).toBe("https://api.example.com/x");
  });

  it("INTERNAL 未指定でも service binding があれば binding を使う", async () => {
    const bindingFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    mockGetAuthEnv.mockReturnValue({
      INTERNAL_API_BASE_URL: "",
      API_SERVICE: { fetch: bindingFetch as unknown as typeof fetch },
    });
    await fetchAuthed("/x");
    const calls = bindingFetch.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe("https://service-binding.local/x");
  });

  it("非 local で transport 未解決なら fail-fast", async () => {
    mockGetAuthEnv.mockReturnValue({ INTERNAL_API_BASE_URL: "" });
    mockGetEnvironment.mockReturnValue("staging");
    await expect(fetchAuthed("/x")).rejects.toThrow(/API transport unresolved/);
  });

  it("GET は service binding transport failure 時に public API base URL へ fallback する", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("binding down");
    });
    mockGetAuthEnv.mockReturnValue({
      API_SERVICE: { fetch: bindingFetch as unknown as typeof fetch },
      INTERNAL_API_BASE_URL: "",
      NEXT_PUBLIC_API_BASE_URL: "https://public-api.example.com",
    });
    mockGetEnvironment.mockReturnValue("staging");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const spy = mockFetchOnce({ status: 200, body: { id: 1 } });
    try {
      await expect(fetchAuthed<{ id: number }>("/me")).resolves.toEqual({ id: 1 });
      expect(spy.mock.calls[0]?.[0]).toBe("https://public-api.example.com/me");
      expect(warn).toHaveBeenCalledWith("api_transport_fallback", {
        from: { transportKind: "service-binding", baseHost: "service-binding.local" },
        to: { transportKind: "http", baseHost: "public-api.example.com" },
        path: "/me",
      });
    } finally {
      warn.mockRestore();
    }
  });

  it("POST は service binding transport failure でも fallback しない", async () => {
    const bindingFetch = vi.fn(async () => {
      throw new TypeError("binding down");
    });
    mockGetAuthEnv.mockReturnValue({
      API_SERVICE: { fetch: bindingFetch as unknown as typeof fetch },
      INTERNAL_API_BASE_URL: "",
      NEXT_PUBLIC_API_BASE_URL: "https://public-api.example.com",
    });
    mockGetEnvironment.mockReturnValue("staging");
    await expect(fetchAuthed("/me/delete-request", { method: "POST" })).rejects.toBeInstanceOf(
      ApiTransportError,
    );
  });

  it("init.headers をマージする", async () => {
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchAuthed("/x", { method: "POST", headers: { "x-custom": "1" } });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("x-custom")).toBe("1");
    expect(init.method).toBe("POST");
  });

  it("source から process.env 直参照と localhost fallback を排除する", () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "authed.ts"),
      "utf8",
    );
    expect(source).not.toContain("process.env[");
    expect(source).not.toContain("127.0.0.1");
  });
});

describe("Error classes", () => {
  it("AuthRequiredError は name と default message を持つ", () => {
    const e = new AuthRequiredError();
    expect(e.name).toBe("AuthRequiredError");
    expect(e.message).toBe("AUTH_REQUIRED");
  });
  it("FetchAuthedError は status / bodyText を保持", () => {
    const e = new FetchAuthedError(503, "down");
    expect(e.name).toBe("FetchAuthedError");
    expect(e.status).toBe(503);
    expect(e.bodyText).toBe("down");
    expect(e.message).toContain("503");
  });
});
