// @vitest-environment node
// ut-07c-followup-001 contract test: POST /admin/meetings/:sessionId/attendance/import
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminAttendanceRoute } from "./attendance";
import { adminAuthHeader, memberAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

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
       VALUES ('m_alpha','alpha@example.com','r_a','r_a','2026-04-01T00:00:00Z'),
              ('m_beta','beta@example.com','r_b','r_b','2026-04-01T00:00:00Z'),
              ('m_dead','dead@example.com','r_d','r_d','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_responses
       (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
       VALUES ('r_a','f','v','h','alpha@example.com','2026-04-01T00:00:00Z','{}',''),
              ('r_b','f','v','h','beta@example.com','2026-04-01T00:00:00Z','{}',''),
              ('r_d','f','v','h','dead@example.com','2026-04-01T00:00:00Z','{}','')`,
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1','MTG','2026-04-01','sys')",
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, is_deleted) VALUES ('m_alpha',0),('m_beta',0),('m_dead',1)`,
    )
    .run();
};

const post = async (
  env: InMemoryD1,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) => {
  const app = createAdminAttendanceRoute();
  return app.request(
    path,
    {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    },
    makeEnv(env),
  );
};

describe("admin attendance import contract", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("case#1: dry-run 成功 (200 + summary, D1 副作用なし)", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=true",
      { rows: [{ memberId: "m_alpha" }, { email: "beta@example.com" }] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      summary: { total: number; ok: number };
      rows: Array<{ status: string }>;
      dryRun: boolean;
      committed: boolean;
    };
    expect(body.summary.total).toBe(2);
    expect(body.summary.ok).toBe(2);
    expect(body.dryRun).toBe(true);
    expect(body.committed).toBe(false);
    const attended = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(attended?.n).toBe(0);
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='attendance.import.add'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(0);
  });

  it("case#2: commit 成功 (200 + audit_log row 追加)", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=false",
      { rows: [{ memberId: "m_alpha" }, { email: "beta@example.com" }] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { committed: boolean; summary: { ok: number } };
    expect(body.committed).toBe(true);
    expect(body.summary.ok).toBe(2);
    const attended = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(attended?.n).toBe(2);
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='attendance.import.add'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(2);
  });

  it("case#3: 500 行超過は 413", async () => {
    const headers = await adminAuthHeader();
    const rows = Array.from({ length: 501 }, (_, i) => ({ memberId: `m_${i}` }));
    const res = await post(env, "/meetings/s1/attendance/import", { rows }, headers);
    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toMatchObject({ error: "payload_too_large" });
  });

  it("case#3b: 500 行ちょうどは 200 を許容（route で 413 を発火させない）", async () => {
    // 内容は invalid でも 413 にはしない確認なので、本テストは route 分岐のみ検証する
    const headers = await adminAuthHeader();
    const rows = Array.from({ length: 500 }, () => ({ memberId: "m_alpha" }));
    const res = await post(env, "/meetings/s1/attendance/import?dryRun=true", { rows }, headers);
    expect(res.status).toBe(200);
  });

  it("case#4: 未認証は 401", async () => {
    const res = await post(env, "/meetings/s1/attendance/import", { rows: [] });
    expect(res.status).toBe(401);
  });

  it("case#5: non-admin は 403", async () => {
    const headers = await memberAuthHeader();
    const res = await post(env, "/meetings/s1/attendance/import", { rows: [] }, headers);
    expect(res.status).toBe(403);
  });

  it("case#5b: session 未存在は 404", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s_missing/attendance/import?dryRun=true",
      { rows: [{ memberId: "m_alpha" }] },
      headers,
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "session_not_found" });
  });

  it("case#5c: invalid JSON は 400", async () => {
    const app = createAdminAttendanceRoute();
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/meetings/s1/attendance/import",
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: "{not json}",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("case#5c2: 空 row は 400 ではなく row status invalid として返す", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=true",
      { rows: [{}] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      rows: Array<{ status: string; message?: string }>;
      summary: { invalid: number };
    };
    expect(body.summary.invalid).toBe(1);
    expect(body.rows[0]).toMatchObject({
      status: "invalid",
      message: "memberId_or_email_required",
    });
  });

  it("case#5c3: dryRun 省略時は安全側の dry-run として扱う", async () => {
    const headers = await adminAuthHeader();
    const res = await post(env, "/meetings/s1/attendance/import", { rows: [{ memberId: "m_alpha" }] }, headers);
    expect(res.status).toBe(200);
    const body = await res.json() as { dryRun: boolean; committed: boolean };
    expect(body.dryRun).toBe(true);
    expect(body.committed).toBe(false);
    const attended = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(attended?.n).toBe(0);
  });

  it("case#5d: dry-run preview で deleted_member が分類される", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=true",
      { rows: [{ memberId: "m_dead" }] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { rows: Array<{ status: string }>; summary: { deletedMember: number } };
    expect(body.rows[0].status).toBe("deleted_member");
    expect(body.summary.deletedMember).toBe(1);
  });

  it("case#5e: 1 行でも非 ok があれば commit してもinsert されない", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=false",
      { rows: [{ memberId: "m_alpha" }, { memberId: "m_dead" }] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { committed: boolean };
    expect(body.committed).toBe(false);
    const attended = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(attended?.n).toBe(0);
  });

  it("case#5f: 同一 payload 内の重複 member は duplicate で commit されない", async () => {
    const headers = await adminAuthHeader();
    const res = await post(
      env,
      "/meetings/s1/attendance/import?dryRun=false",
      { rows: [{ email: "alpha@example.com" }, { memberId: "m_alpha" }] },
      headers,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as {
      committed: boolean;
      rows: Array<{ status: string; message?: string }>;
      summary: { ok: number; duplicate: number };
    };
    expect(body.committed).toBe(false);
    expect(body.summary.ok).toBe(1);
    expect(body.summary.duplicate).toBe(1);
    expect(body.rows[1]).toMatchObject({
      status: "duplicate",
      message: "duplicate_in_payload",
    });
    const attended = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(attended?.n).toBe(0);
  });
});
