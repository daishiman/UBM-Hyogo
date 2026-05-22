// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as adminUsers from "../adminUsers";
import { adminEmail } from "../_shared/brand";
import { seedAdminUsers } from "../__fixtures__/admin.fixture";

describe("adminUsers", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.loadFixtures([seedAdminUsers]);
  });

  it("findByEmail で存在する admin を返す", async () => {
    const r = await adminUsers.findByEmail(env.ctx, adminEmail("owner@example.com"));
    expect(r).not.toBeNull();
    expect(r?.email).toBe("owner@example.com");
    expect(r?.active).toBe(true);
    expect(r?.displayName).toBe("Owner");
  });

  it("findByEmail で存在しない email は null（throw しない）", async () => {
    const r = await adminUsers.findByEmail(env.ctx, adminEmail("nobody@example.com"));
    expect(r).toBeNull();
  });

  it("listAll で全 admin を返す", async () => {
    const rows = await adminUsers.listAll(env.ctx);
    expect(rows.length).toBe(1);
  });

  it("isActiveAdmin が active=1 の admin で true", async () => {
    expect(
      await adminUsers.isActiveAdmin(env.ctx, adminEmail("owner@example.com")),
    ).toBe(true);
    expect(
      await adminUsers.isActiveAdmin(env.ctx, adminEmail("nobody@example.com")),
    ).toBe(false);
  });
});
