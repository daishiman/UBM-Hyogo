// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminDashboardRoute } from "./dashboard";
import { adminAuthHeader, memberAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("GET /admin/dashboard", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("Authorization 未指定は 401", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request("/dashboard", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("正常系: KPI 4 = 0、recentActions は配列", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const totals = body.totals as Record<string, number>;
    expect(totals.totalMembers).toBe(0);
    expect(totals.publicMembers).toBe(0);
    expect(totals.untaggedMembers).toBe(0);
    expect(totals.unresolvedSchema).toBe(0);
    expect(Array.isArray(body.recentActions)).toBe(true);
  });
});

describe("GET /admin/dashboard/attendance/* (ut-02a-followup-002)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("overview: 認証なしは 401", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request("/dashboard/attendance/overview", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("by-session: 認証なしは 401", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request("/dashboard/attendance/by-session", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("ranking: 認証なしは 401", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request("/dashboard/attendance/ranking", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("overview: 非 admin は 403", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard/attendance/overview",
      { headers: { ...(await memberAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(403);
  });

  it("overview: admin 通過時 200 + AC-5 shape", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard/attendance/overview",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, number>;
    expect(typeof body.totalSessions).toBe("number");
    expect(typeof body.totalMembers).toBe("number");
    expect(typeof body.overallRate).toBe("number");
  });

  it("by-session: admin 通過時 200 + 配列", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard/attendance/by-session",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("ranking: admin 通過時 200 + 配列", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard/attendance/ranking",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("limit が不正なら 400", async () => {
    const app = createAdminDashboardRoute();
    for (const path of [
      "/dashboard/attendance/by-session?limit=0",
      "/dashboard/attendance/by-session?limit=10abc",
      "/dashboard/attendance/ranking?limit=201",
      "/dashboard/attendance/ranking?limit=abc",
    ]) {
      const res = await app.request(
        path,
        { headers: { ...(await adminAuthHeader()) } },
        makeEnv(env),
      );
      expect(res.status).toBe(400);
    }
  });
});
