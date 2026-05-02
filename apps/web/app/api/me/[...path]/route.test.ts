// 06b-B: /api/me/* browser proxy route contract.
// D1 直接アクセス禁止を守りつつ、browser client から backend /me/* へ中継する。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

vi.mock("../../../../src/lib/auth", () => ({
  auth: () => authMock(),
}));

import { GET, POST } from "./route";

const makeReq = (
  url: string,
  init: RequestInit = {},
): Parameters<typeof POST>[0] => new Request(url, init) as Parameters<typeof POST>[0];

const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });

beforeEach(() => {
  authMock.mockReset();
  vi.stubEnv("INTERNAL_API_BASE_URL", "https://api.internal.test/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/api/me/[...path] proxy", () => {
  it("session が無い場合は upstream に触らず 401 を返す", async () => {
    authMock.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeReq("https://web.test/api/me/visibility-request", {
        method: "POST",
        body: JSON.stringify({ desiredState: "hidden" }),
      }),
      ctx(["visibility-request"]),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: "UNAUTHENTICATED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POST body と cookie/header を backend /me/* へ転送する", async () => {
    authMock.mockResolvedValue({ user: { memberId: "m_1" } });
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ queueId: "q_1", status: "pending" }), {
        status: 202,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeReq("https://web.test/api/me/visibility-request?dryRun=1", {
        method: "POST",
        headers: {
          cookie: "next-auth.session-token=s",
          authorization: "Bearer dev",
          "content-type": "application/json",
          "x-ubm-dev-session": "1",
        },
        body: JSON.stringify({ desiredState: "hidden" }),
      }),
      ctx(["visibility-request"]),
    );

    expect(res.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.internal.test/me/visibility-request?dryRun=1",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ desiredState: "hidden" }),
        headers: expect.objectContaining({
          cookie: "next-auth.session-token=s",
          authorization: "Bearer dev",
          "content-type": "application/json",
          "x-ubm-dev-session": "1",
        }),
      }),
    );
  });

  it("GET は query を保ったまま upstream status/body を返す", async () => {
    authMock.mockResolvedValue({ user: { memberId: "m_1" } });
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(
      makeReq("https://web.test/api/me/profile?include=attendance", {
        method: "GET",
        headers: { cookie: "s=1" },
      }),
      ctx(["profile"]),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.internal.test/me/profile?include=attendance",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ cookie: "s=1" }),
      }),
    );
  });
});
