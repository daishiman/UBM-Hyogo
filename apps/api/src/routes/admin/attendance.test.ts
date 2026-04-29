// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminAttendanceRoute } from "./attendance";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_alive','alive@example.com','r_alive','r_alive','2026-04-01T00:00:00Z'),
              ('m_dead','dead@example.com','r_dead','r_dead','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1','MTG','2026-04-01','sys')",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, is_deleted) VALUES ('m_alive', 0)",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, is_deleted) VALUES ('m_dead', 1)",
    )
    .run();
};

describe("admin attendance", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("authz: 401", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s1/attendance",
      { method: "POST", body: JSON.stringify({ memberId: "m_alive" }) },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("正常系 200", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s1/attendance",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m_alive" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  });

  it("重複は 409", async () => {
    const app = createAdminAttendanceRoute();
    const opts = {
      method: "POST",
      headers: { ...await adminAuthHeader(), "content-type": "application/json" },
      body: JSON.stringify({ memberId: "m_alive" }),
    };
    await app.request("/meetings/s1/attendance", opts, makeEnv(env));
    const res = await app.request("/meetings/s1/attendance", opts, makeEnv(env));
    expect(res.status).toBe(409);
  });

  it("削除済みは 422", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s1/attendance",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m_dead" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("session 未存在は 404", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s_x/attendance",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m_alive" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("DELETE 200", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s1/attendance/m_alive",
      { method: "DELETE", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  });
});
