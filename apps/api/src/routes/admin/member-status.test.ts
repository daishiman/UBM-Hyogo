// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMemberStatusRoute } from "./member-status";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("PATCH /admin/members/:memberId/status", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        "INSERT INTO member_status (member_id, publish_state) VALUES ('m1', 'member_only')",
      )
      .run();
  }, 30000);

  it("authz: 未認証 401", async () => {
    const app = createAdminMemberStatusRoute();
    const res = await app.request(
      "/members/m1/status",
      { method: "PATCH", body: JSON.stringify({ publishState: "public" }) },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("正常系: publishState 更新 200", async () => {
    const app = createAdminMemberStatusRoute();
    const res = await app.request(
      "/members/m1/status",
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ publishState: "public" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  });

  it("body 空は 400", async () => {
    const app = createAdminMemberStatusRoute();
    const res = await app.request(
      "/members/m1/status",
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("未存在 member は 404", async () => {
    const app = createAdminMemberStatusRoute();
    const res = await app.request(
      "/members/m_x/status",
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ publishState: "hidden" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });
});
