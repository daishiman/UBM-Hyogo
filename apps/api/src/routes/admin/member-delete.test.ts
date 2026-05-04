// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMemberDeleteRoute } from "./member-delete";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("admin member delete/restore", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        `INSERT INTO member_identities
         (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z')`,
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_status (member_id, publish_state) VALUES ('m1', 'public')",
      )
      .run();
  }, 30000);

  it("authz: 401", async () => {
    const app = createAdminMemberDeleteRoute();
    const res = await app.request(
      "/members/m1/delete",
      { method: "POST", body: JSON.stringify({ reason: "x" }) },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("delete -> restore 200/200 with contract response shape", async () => {
    const app = createAdminMemberDeleteRoute();
    const r1 = await app.request(
      "/members/m1/delete",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ reason: "test" }),
      },
      makeEnv(env),
    );
    expect(r1.status).toBe(200);
    await expect(r1.json()).resolves.toMatchObject({
      id: "m1",
      isDeleted: true,
      deletedAt: expect.any(String),
    });
    const r2 = await app.request(
      "/members/m1/restore",
      { method: "POST", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(r2.status).toBe(200);
    await expect(r2.json()).resolves.toMatchObject({
      id: "m1",
      restoredAt: expect.any(String),
    });
    const audits = await env.db
      .prepare("SELECT actor_id, actor_email, action FROM audit_log ORDER BY created_at ASC")
      .all<{ actor_id: string; actor_email: string; action: string }>();
    expect(audits.results).toEqual([
      {
        actor_id: "m_admin",
        actor_email: "admin@example.com",
        action: "admin.member.deleted",
      },
      {
        actor_id: "m_admin",
        actor_email: "admin@example.com",
        action: "admin.member.restored",
      },
    ]);
  });

  it("reason 欠落は 422", async () => {
    const app = createAdminMemberDeleteRoute();
    const res = await app.request(
      "/members/m1/delete",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("reason 501 文字超は 422", async () => {
    const app = createAdminMemberDeleteRoute();
    const res = await app.request(
      "/members/m1/delete",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ reason: "x".repeat(501) }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("二重 delete は 409", async () => {
    const app = createAdminMemberDeleteRoute();
    const opts = {
      method: "POST",
      headers: { ...await adminAuthHeader(), "content-type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    };
    await app.request("/members/m1/delete", opts, makeEnv(env));
    const res = await app.request("/members/m1/delete", opts, makeEnv(env));
    expect(res.status).toBe(409);
  });

  it("未削除 restore は 409", async () => {
    const app = createAdminMemberDeleteRoute();
    const res = await app.request(
      "/members/m1/restore",
      { method: "POST", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
  });
});
