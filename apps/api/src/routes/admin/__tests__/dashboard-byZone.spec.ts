// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createAdminDashboardRoute } from "../dashboard";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("GET /admin/dashboard byZone field", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("byZone は length=3 で key 順序 0to1 -> 1to10 -> 10to100 固定", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const byZone = body.byZone as Array<{ key: string; tone: string; total: number; count: number }>;
    expect(Array.isArray(byZone)).toBe(true);
    expect(byZone.length).toBe(3);
    expect(byZone.map((b) => b.key)).toEqual(["0to1", "1to10", "10to100"]);
    expect(byZone.map((b) => b.tone)).toEqual(["info", "accent", "ok"]);
    for (const b of byZone) {
      expect(b.count).toBeGreaterThanOrEqual(0);
      expect(b.total).toBeGreaterThanOrEqual(0);
    }
  });
});
