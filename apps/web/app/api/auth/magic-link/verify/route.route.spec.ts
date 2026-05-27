import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const makeReq = (body: unknown): Parameters<typeof POST>[0] =>
  new Request("https://web.test/api/auth/magic-link/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0];

describe("POST /api/auth/magic-link/verify", () => {
  beforeEach(() => {
    vi.stubEnv("INTERNAL_API_BASE_URL", "https://api.internal.test/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses env.ts accessor resolution and normalizes trailing slash", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeReq({ email: "u@example.com", token: "t" }));

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.internal.test/auth/magic-link/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "u@example.com", token: "t" }),
      }),
    );
  });

  it("falls back to local API when INTERNAL_API_BASE_URL is not configured", async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn(async (..._args: unknown[]) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(makeReq({ email: "u@example.com", token: "t" }));

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8787/auth/magic-link/verify");
  });
});
