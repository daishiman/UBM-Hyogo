// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminDashboardRoute } from "./dashboard";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

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
