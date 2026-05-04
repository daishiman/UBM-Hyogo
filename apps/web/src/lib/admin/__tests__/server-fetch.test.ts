import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// next/headers の cookies() を mock する。各 it 内で値を上書き可能にする。
let cookieValue = "";
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ toString: () => cookieValue })),
}));

import { fetchAdmin } from "../server-fetch";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("fetchAdmin", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cookieValue = "";
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://api.test");
    vi.stubEnv("INTERNAL_AUTH_SECRET", "secret-xyz");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("GET: x-internal-auth と accept ヘッダーを付けて INTERNAL_API_BASE_URL+path を叩く", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { ok: 1 }));
    const out = await fetchAdmin<{ ok: number }>("/admin/x");
    expect(out).toEqual({ ok: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/admin/x");
    expect(init.method).toBe("GET");
    expect(init.cache).toBe("no-store");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-internal-auth"]).toBe("secret-xyz");
    expect(headers.accept).toBe("application/json");
    expect(headers.cookie).toBeUndefined();
  });

  it("末尾スラッシュ付き base URL は重複スラッシュを除去する", async () => {
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://api.test/");
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await fetchAdmin("/admin/y");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe("http://api.test/admin/y");
  });

  it("INTERNAL_API_BASE_URL 未設定時は fallback 127.0.0.1:8787 を使う", async () => {
    vi.stubEnv("INTERNAL_API_BASE_URL", "");
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await fetchAdmin("/p");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe("http://127.0.0.1:8787/p");
  });

  it("INTERNAL_AUTH_SECRET 未設定時は空文字を載せる", async () => {
    vi.stubEnv("INTERNAL_AUTH_SECRET", "");
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await fetchAdmin("/p");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-internal-auth"]).toBe("");
  });

  it("cookie ヘッダーが空でなければ載せる", async () => {
    cookieValue = "session=abc";
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await fetchAdmin("/p");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).cookie).toBe("session=abc");
  });

  it("body あり: content-type=application/json を付け JSON シリアライズする", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { ok: true }));
    await fetchAdmin("/p", { method: "POST", body: { a: 1 } });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/json",
    );
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect(init.method).toBe("POST");
  });

  it("res.ok=false のとき status を含む Error を投げる", async () => {
    fetchSpy.mockResolvedValue(new Response("boom", { status: 503 }));
    await expect(fetchAdmin("/dead")).rejects.toThrow(
      /admin api \/dead failed: 503/,
    );
  });
});
