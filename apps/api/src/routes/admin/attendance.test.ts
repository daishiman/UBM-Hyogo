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
      `INSERT INTO member_responses
       (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
       VALUES ('r_alive','form','rev','hash','alive@example.com','2026-04-01T00:00:00Z','{}','alive'),
              ('r_dead','form','rev','hash','dead@example.com','2026-04-01T00:00:00Z','{}','dead')`,
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

  it("正常系 201 + audit", async () => {
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
    expect(res.status).toBe(201);
    const body = await res.json() as { attendance: { meetingSessionId: string; memberId: string } };
    expect(body.attendance).toMatchObject({ meetingSessionId: "s1", memberId: "m_alive" });
    const audit = await env.db
      .prepare("SELECT actor_id, actor_email, action, target_type, target_id, after_json FROM audit_log")
      .first<{ actor_id: string; actor_email: string; action: string; target_type: string; target_id: string; after_json: string }>();
    expect(audit).toMatchObject({
      actor_id: "m_admin",
      actor_email: "admin@example.com",
      action: "attendance.add",
      target_type: "meeting",
      target_id: "s1",
    });
    expect(JSON.parse(audit?.after_json ?? "{}")).toMatchObject({ memberId: "m_alive" });
  });

  it("重複は 409 + existing row", async () => {
    const app = createAdminAttendanceRoute();
    const opts = {
      method: "POST",
      headers: { ...await adminAuthHeader(), "content-type": "application/json" },
      body: JSON.stringify({ memberId: "m_alive" }),
    };
    await app.request("/meetings/s1/attendance", opts, makeEnv(env));
    const res = await app.request("/meetings/s1/attendance", opts, makeEnv(env));
    expect(res.status).toBe(409);
    const body = await res.json() as { error: string; existing: { meetingSessionId: string; memberId: string } };
    expect(body).toMatchObject({
      error: "attendance_already_recorded",
      existing: { meetingSessionId: "s1", memberId: "m_alive" },
    });
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
    await expect(res.json()).resolves.toMatchObject({ error: "member_is_deleted" });
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
    await expect(res.json()).resolves.toMatchObject({ error: "session_not_found" });
  });

  it("candidates は削除済みと登録済みを除外する", async () => {
    const app = createAdminAttendanceRoute();
    await app.request(
      "/meetings/s1/attendance",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m_alive" }),
      },
      makeEnv(env),
    );
    const res = await app.request(
      "/meetings/s1/attendance/candidates",
      { method: "GET", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ memberId: string }> };
    expect(body.items.map((x) => x.memberId)).toEqual([]);
  });

  it("candidates は session 未存在なら 404", async () => {
    const app = createAdminAttendanceRoute();
    const res = await app.request(
      "/meetings/s_x/attendance/candidates",
      { method: "GET", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "session_not_found" });
  });

  it("DELETE 200 + audit, missing row 404", async () => {
    const app = createAdminAttendanceRoute();
    await app.request(
      "/meetings/s1/attendance",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m_alive" }),
      },
      makeEnv(env),
    );
    const res = await app.request(
      "/meetings/s1/attendance/m_alive",
      { method: "DELETE", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const missing = await app.request(
      "/meetings/s1/attendance/m_alive",
      { method: "DELETE", headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ error: "attendance_not_found" });
    const audit = await env.db
      .prepare("SELECT action, before_json FROM audit_log WHERE action = 'attendance.remove'")
      .first<{ action: string; before_json: string }>();
    expect(audit?.action).toBe("attendance.remove");
    expect(JSON.parse(audit?.before_json ?? "{}")).toMatchObject({ memberId: "m_alive" });
  });
});
