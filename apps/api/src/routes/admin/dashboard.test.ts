// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminDashboardRoute } from "./dashboard";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
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

  it("正常系: schema 未投入なら schemaState=pending_review、totals=0 群", async () => {
    const app = createAdminDashboardRoute();
    const res = await app.request(
      "/dashboard",
      { headers: { Authorization: "Bearer admin-token" } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.schemaState).toBe("pending_review");
    const totals = body.totals as Record<string, number>;
    expect(totals.members).toBe(0);
    expect(totals.deletedMembers).toBe(0);
  });
});
