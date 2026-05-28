// ut-web-cov-03 Phase 5: fetch/authed.ts unit test。
// 観点: path 検証 / cookie 転送 / 200 / 401(AuthRequiredError) / 403/5xx(FetchAuthedError) / network-fail。

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieList: Array<{ name: string; value: string }> = [];
const mockGetApiBaseEnv = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => cookieList,
  }),
}));
vi.mock("@/lib/env", () => ({
  getApiBaseEnv: mockGetApiBaseEnv,
}));

import {
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
    PUBLIC_API_BASE_URL: string;
  }> = {},
) => ({
  ENVIRONMENT: "local",
  NEXT_PUBLIC_API_BASE_URL: "https://web.example.com",
  PUBLIC_API_BASE_URL: "https://public.example.com",
  INTERNAL_API_BASE_URL: "https://api.example.com",
  ...overrides,
});

describe("fetchAuthed", () => {
  beforeEach(() => {
    setCookies();
    mockGetApiBaseEnv.mockReturnValue(makeEnv());
  });
  afterEach(() => {
    restoreFetch();
    mockGetApiBaseEnv.mockReset();
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
    await expect(fetchAuthed("/me")).rejects.toBeInstanceOf(TypeError);
  });

  it("INTERNAL_API_BASE_URL 末尾 / を取り除く", async () => {
    mockGetApiBaseEnv.mockReturnValue(
      makeEnv({ INTERNAL_API_BASE_URL: "https://api.example.com/" }),
    );
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchAuthed("/x");
    expect(spy.mock.calls[0]?.[0]).toBe("https://api.example.com/x");
  });

  it("INTERNAL 未指定 / PUBLIC 指定で PUBLIC_API_BASE_URL を使う", async () => {
    mockGetApiBaseEnv.mockReturnValue(
      makeEnv({
        INTERNAL_API_BASE_URL: "",
        PUBLIC_API_BASE_URL: "https://public.example.com",
      }),
    );
    const spy = mockFetchOnce({ status: 200, body: {} });
    await fetchAuthed("/x");
    expect(spy.mock.calls[0]?.[0]).toBe("https://public.example.com/x");
  });

  it("いずれも未指定で localhost fallback せず fail-fast", async () => {
    mockGetApiBaseEnv.mockReturnValue(
      makeEnv({ INTERNAL_API_BASE_URL: "", PUBLIC_API_BASE_URL: "" }),
    );
    await expect(fetchAuthed("/x")).rejects.toThrow(
      /neither INTERNAL_API_BASE_URL nor PUBLIC_API_BASE_URL/,
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
