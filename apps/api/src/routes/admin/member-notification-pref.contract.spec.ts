// @vitest-environment node
// Issue #55: PATCH /admin/members/:memberId/notification-pref contract spec
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMemberNotificationPrefRoute } from "./member-notification-pref";
import { adminAuthHeader, memberAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedIdentity = async (env: InMemoryD1, memberId: string) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?3, ?4, ?4, ?4)`,
    )
    .bind(memberId, `${memberId}@example.com`, `resp_${memberId}`, "2026-05-23T00:00:00Z")
    .run();
};

describe("PATCH /admin/members/:memberId/notification-pref", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("非 admin token は 403 を返す", async () => {
    const app = createAdminMemberNotificationPrefRoute();
    const res = await app.request(
      "/members/m1/notification-pref",
      {
        method: "PATCH",
        headers: {
          ...(await memberAuthHeader()),
          "content-type": "application/json",
        },
        body: JSON.stringify({ notificationOptOut: true }),
      },
      makeEnv(env),
    );
    expect([401, 403]).toContain(res.status);
  });

  it("不正 body (notificationOptOut 欠落) は 400", async () => {
    const app = createAdminMemberNotificationPrefRoute();
    const res = await app.request(
      "/members/m1/notification-pref",
      {
        method: "PATCH",
        headers: {
          ...(await adminAuthHeader()),
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("admin が opt-out を切り替えると 200 + member_status に永続化される", async () => {
    await seedIdentity(env, "m_target");
    const app = createAdminMemberNotificationPrefRoute();
    const res = await app.request(
      "/members/m_target/notification-pref",
      {
        method: "PATCH",
        headers: {
          ...(await adminAuthHeader()),
          "content-type": "application/json",
        },
        body: JSON.stringify({ notificationOptOut: true }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      memberId: string;
      notificationOptOut: boolean;
    };
    expect(body).toEqual({
      ok: true,
      memberId: "m_target",
      notificationOptOut: true,
    });
    const row = await env.db
      .prepare(
        "SELECT notification_opt_out FROM member_status WHERE member_id=?1",
      )
      .bind("m_target")
      .first<{ notification_opt_out: number }>();
    expect(row?.notification_opt_out).toBe(1);
  });

  it("冪等性: 同値 PATCH は 200 を返す", async () => {
    await seedIdentity(env, "m_idem");
    const app = createAdminMemberNotificationPrefRoute();
    const headers = {
      ...(await adminAuthHeader()),
      "content-type": "application/json",
    };
    const first = await app.request(
      "/members/m_idem/notification-pref",
      { method: "PATCH", headers, body: JSON.stringify({ notificationOptOut: true }) },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const second = await app.request(
      "/members/m_idem/notification-pref",
      { method: "PATCH", headers, body: JSON.stringify({ notificationOptOut: true }) },
      makeEnv(env),
    );
    expect(second.status).toBe(200);
  });
});
