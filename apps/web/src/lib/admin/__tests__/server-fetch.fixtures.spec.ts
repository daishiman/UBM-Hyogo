// Vitest 4 branch coverage 補完: fetchAdmin の Playwright 用 inline fixture 分岐
// （src/lib/admin/server-fetch.ts L449-573）を環境変数ゲートごとに実際に踏む。
// 各 fixture は process.env の PLAYWRIGHT_* フラグ + opts.method === undefined +
// path prefix の AND 条件で起動し、HTTP/binding transport を経由せず固定値を返す。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareContext = vi.fn();
const cookies = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

import { fetchAdmin } from "../server-fetch";

const baseEnv = {
  ENVIRONMENT: "staging",
  NEXT_PUBLIC_API_BASE_URL: "https://web.example.test",
  INTERNAL_API_BASE_URL: "https://api.example.test/",
  INTERNAL_AUTH_SECRET: "internal-secret",
  AUTH_URL: "https://web.example.test",
  SENTRY_ENVIRONMENT: "staging",
  SENTRY_TRACES_SAMPLE_RATE: "0.1",
};

describe("fetchAdmin Playwright fixtures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    cloudflareContext.mockReset();
    cookies.mockReset();
    cookies.mockResolvedValue({ toString: () => "session=abc" });
    cloudflareContext.mockReturnValue({ env: baseEnv });
    // 全 fixture 分岐は NODE_ENV !== "production" を要求する。
    vi.stubEnv("NODE_ENV", "test");
    // fixture が起動した場合 transport は通らないが、念のため fetch を spy して
    // 「fixture が transport を short-circuit している」ことも検証する。
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("transport must not be reached when fixture is active");
      }),
    );
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("TASK18_SMOKE: /admin/tags/queue は tag queue fixture を返す", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK18_SMOKE", "1");
    const r = await fetchAdmin<{ total: number; items: unknown[] }>(
      "/admin/tags/queue",
    );
    expect(r.total).toBe(2);
    expect(r.items).toHaveLength(2);
  });

  it("TASK18_SMOKE: /admin/meetings は meetings fixture（完全一致 path）", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK18_SMOKE", "1");
    const r = await fetchAdmin<{ total: number; items: Array<{ sessionId: string }> }>(
      "/admin/meetings",
    );
    expect(r.items[0]?.sessionId).toBe("session_task18");
  });

  it("TASK18_SMOKE: /admin/meetings? も meetings fixture（prefix path）", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK18_SMOKE", "1");
    const r = await fetchAdmin<{ total: number }>("/admin/meetings?cursor=x");
    expect(r.total).toBe(1);
  });

  it("TASK18_SMOKE: /admin/members は members fixture を返す", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK18_SMOKE", "1");
    const r = await fetchAdmin<{ members: Array<{ memberId: string }> }>(
      "/admin/members?page=1",
    );
    expect(r.members.map((m) => m.memberId)).toEqual(["mem_alpha", "mem_beta"]);
  });

  it("ADMIN_REQUESTS_FIXTURE: /admin/requests は requests fixture を返す", async () => {
    vi.stubEnv("PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE", "1");
    const r = await fetchAdmin<{ ok: boolean; items: unknown[] }>(
      "/admin/requests?status=pending",
    );
    expect(r.ok).toBe(true);
    expect(r.items).toHaveLength(3);
  });

  it("ADMIN_IDENTITY_CONFLICTS_FIXTURE: schema parse 済み 2 件を返す", async () => {
    vi.stubEnv("PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE", "1");
    const r = await fetchAdmin<{ items: Array<{ conflictId: string }> }>(
      "/admin/identity-conflicts",
    );
    expect(r.items).toHaveLength(2);
    expect(r.items[0]?.conflictId).toBe("m_src_01__m_dst_01");
  });

  it("ADMIN_MEMBER_DELETE_FIXTURE: /admin/members（filter なし）は 2 件", async () => {
    vi.stubEnv("PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE", "1");
    const r = await fetchAdmin<{ total: number }>("/admin/members");
    expect(r.total).toBe(2);
  });

  it("ADMIN_MEMBER_DELETE_FIXTURE: filter=deleted は isDeleted のみ", async () => {
    vi.stubEnv("PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE", "1");
    const r = await fetchAdmin<{ total: number; members: Array<{ isDeleted: boolean }> }>(
      "/admin/members?filter=deleted",
    );
    expect(r.total).toBe(1);
    expect(r.members[0]?.isDeleted).toBe(true);
  });

  it("ADMIN_MEMBER_DELETE_FIXTURE: /admin/audit は delete audit fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE", "1");
    const r = await fetchAdmin<{ items: Array<{ action: string }> }>(
      "/admin/audit",
    );
    expect(r.items[0]?.action).toBe("admin.member.deleted");
  });

  it("ISSUE776_SCHEMA_BULK_FIXTURE: /admin/schema/diff は 30 件 bulk fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_ISSUE776_SCHEMA_BULK_FIXTURE", "1");
    const r = await fetchAdmin<{ total: number; items: unknown[] }>(
      "/admin/schema/diff",
    );
    expect(r.total).toBe(30);
    expect(r.items).toHaveLength(30);
  });

  it("TASK17_ADMIN_FIXTURE: /admin/dashboard（完全一致）は dashboard fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ totals: { totalMembers: number } }>(
      "/admin/dashboard",
    );
    expect(r.totals.totalMembers).toBe(128);
  });

  it("TASK17_ADMIN_FIXTURE: /admin/members は members fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ members: unknown[] }>("/admin/members");
    expect(r.members).toHaveLength(2);
  });

  it("TASK17_ADMIN_FIXTURE: /admin/schema/diff は task17 schema fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ total: number }>("/admin/schema/diff");
    expect(r.total).toBe(4);
  });

  it("TASK17_ADMIN_FIXTURE: /admin/audit（default）は audit fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ items: Array<{ auditId: string }>; nextCursor: string | null }>(
      "/admin/audit",
    );
    expect(r.items[0]?.auditId).toBe("audit_default_001");
    expect(r.nextCursor).toBe("cursor-task17-next");
  });

  it("TASK17_ADMIN_FIXTURE: /admin/audit?actorEmail=... は filtered audit", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ items: Array<{ auditId: string; action: string }> }>(
      "/admin/audit?actorEmail=foo@example.com",
    );
    expect(r.items[0]?.auditId).toBe("audit_filtered_001");
    expect(r.items[0]?.action).toBe("schema.alias.assign");
  });

  it("TASK17_ADMIN_FIXTURE: /admin/audit?targetType=empty は空配列", async () => {
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const r = await fetchAdmin<{ items: unknown[]; nextCursor: string | null }>(
      "/admin/audit?targetType=empty",
    );
    expect(r.items).toHaveLength(0);
    expect(r.nextCursor).toBeNull();
  });

  it("PLAYWRIGHT_TEST: /admin/schema/diff は task17 schema fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    const r = await fetchAdmin<{ total: number }>("/admin/schema/diff");
    expect(r.total).toBe(4);
  });

  it("PLAYWRIGHT_TEST: /admin/tags（完全一致）は tag master fixture", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    const r = await fetchAdmin<{ total: number; items: Array<{ code: string }> }>(
      "/admin/tags",
    );
    expect(r.total).toBe(3);
    expect(r.items.map((i) => i.code)).toContain("mentor");
  });

  it("PLAYWRIGHT_TEST: /admin/tags? も tag master fixture（prefix path）", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    const r = await fetchAdmin<{ total: number }>("/admin/tags?category=role");
    expect(r.total).toBe(3);
  });

  it("method 指定がある場合 fixture を起動せず transport へ進む（mutation 経路）", async () => {
    // opts.method !== undefined のため全 fixture を false 分岐で通過 → transport へ。
    vi.stubEnv("PLAYWRIGHT_TASK17_ADMIN_FIXTURE", "1");
    const fetchMock = vi.fn(async () => Response.json({ mutated: true }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchAdmin<{ mutated: boolean }>("/admin/schema/diff", {
      method: "POST",
      body: { x: 1 },
    });
    expect(r.mutated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
