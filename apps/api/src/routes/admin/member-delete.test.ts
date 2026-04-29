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

  it("delete -> restore 200/200", async () => {
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
    const r2 = await app.request(
      "/members/m1/restore",
      { method: "POST", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(r2.status).toBe(200);
  });

  it("reason 欠落は 400", async () => {
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
    expect(res.status).toBe(400);
  });
});
