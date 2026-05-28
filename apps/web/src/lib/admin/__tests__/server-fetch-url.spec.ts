// H3 回帰防止: fetchAdmin の URL 組み立てが ${resolveApiBase()}${path} に一致し
// trailing slash 混入時も二重 slash にならないことを保証
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env.ts は process.env を介して getEnv() を構成する
vi.mock("../../env", () => ({
  getEnv: () => ({
    INTERNAL_API_BASE_URL: "https://api.example.test/",
    INTERNAL_AUTH_SECRET: "secret",
  }),
  getPublicFetchEnv: () => ({ NODE_ENV: "test" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "" }),
}));

describe("fetchAdmin URL 組み立て", () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  beforeEach(() => {
    capturedUrl = "";
    globalThis.fetch = (async (url: string) => {
      capturedUrl = url;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("/admin/dashboard が ${apiBase}/admin/dashboard に組み立たる (trailing slash 削除)", async () => {
    const { fetchAdmin } = await import("../server-fetch");
    await fetchAdmin("/admin/dashboard");
    expect(capturedUrl).toBe("https://api.example.test/admin/dashboard");
    expect(capturedUrl).not.toMatch(/\/\/admin\b/);
  });
});
