// followup-001 T-5.1: pass-through proxy の fail-fast / 404 マスクなし検証
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const authMock = vi.fn();
vi.mock("../../../../src/lib/auth", () => ({
  getAuth: async () => ({ auth: authMock }),
}));

import { GET } from "./route";

interface MockParams {
  params: Promise<{ path: string[] }>;
}

function makeRequest(url: string, headers: Record<string, string> = {}): { req: Parameters<typeof GET>[0]; ctx: MockParams } {
  const req = {
    url,
    method: "GET",
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    text: async () => "",
  } as unknown as Parameters<typeof GET>[0];
  return {
    req,
    ctx: { params: Promise.resolve({ path: url.split("/api/admin/")[1].split("?")[0].split("/") }) },
  };
}

const ORIGINAL_ENV = { ...process.env };

describe("/api/admin/[...path] proxy (T-5.1)", () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { isAdmin: true, memberId: "m_1" } });
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 500 when INTERNAL_API_BASE_URL is missing in staging (no 127.0.0.1 fallback)", async () => {
    delete process.env["INTERNAL_API_BASE_URL"];
    process.env["ENVIRONMENT"] = "staging";
    (process.env as Record<string, string>)["NODE_ENV"] = "production";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { req, ctx } = makeRequest("https://web.test/api/admin/members");
    const res = await GET(req, ctx);
    expect(res.status).toBe(500);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("internal_api_base_url_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards Authorization header and propagates upstream 401 unchanged", async () => {
    process.env["INTERNAL_API_BASE_URL"] = "https://api.example.test";
    const fetchMock = vi.fn(async () => new Response("unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const { req, ctx } = makeRequest("https://web.test/api/admin/members", {
      authorization: "Bearer X",
      cookie: "session=abc",
    });
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }] | undefined;
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    expect(firstCall[0]).toBe("https://api.example.test/admin/members");
    expect(firstCall[1].headers.authorization).toBe("Bearer X");
    expect(firstCall[1].headers.cookie).toBe("session=abc");
  });

  it("injects SYNC_ADMIN_TOKEN for current sync responses endpoint", async () => {
    process.env["INTERNAL_API_BASE_URL"] = "https://api.example.test";
    process.env["SYNC_ADMIN_TOKEN"] = "sync-secret";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { req, ctx } = makeRequest(
      "https://web.test/api/admin/sync/responses?fullSync=true",
      { authorization: "Bearer browser-token" },
    );
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }] | undefined;
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    expect(firstCall[0]).toBe("https://api.example.test/admin/sync/responses?fullSync=true");
    expect(firstCall[1].headers.authorization).toBe("Bearer sync-secret");
  });

  it("returns 500 for sync endpoint when SYNC_ADMIN_TOKEN is missing", async () => {
    process.env["INTERNAL_API_BASE_URL"] = "https://api.example.test";
    delete process.env["SYNC_ADMIN_TOKEN"];
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { req, ctx } = makeRequest(
      "https://web.test/api/admin/sync/responses",
      { authorization: "Bearer browser-token" },
    );
    const res = await GET(req, ctx);
    expect(res.status).toBe(500);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("sync_admin_token_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 when session is not admin (no 404 mask)", async () => {
    authMock.mockResolvedValueOnce({ user: { isAdmin: false } });
    const { req, ctx } = makeRequest("https://web.test/api/admin/members");
    const res = await GET(req, ctx);
    expect(res.status).toBe(403);
  });
});
