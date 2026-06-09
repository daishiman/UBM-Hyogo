// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { adminMemberFieldsRoute } from "./member-fields";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("PUT /admin/member-fields/:memberId", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m1', 'm1@example.com', 'r1', 'r1', '2026-01-01T00:00:00Z')`,
      )
      .run();
  }, 30000);

  it("authz: 未認証 401", async () => {
    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m1",
      {
        method: "PUT",
        body: JSON.stringify({ stableKey: "fullName", value: "X" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("正常系: override upsert 200 + DB 反映", async () => {
    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m1",
      {
        method: "PUT",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ stableKey: "fullName", value: "Admin Name" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const row = await env.db
      .prepare(
        "SELECT value_json, updated_by FROM member_field_overrides WHERE member_id='m1' AND stable_key='fullName'",
      )
      .first<{ value_json: string; updated_by: string }>();
    expect(row?.value_json).toBe('"Admin Name"');
  });

  it("GET は response 値と override 値を merge して返す", async () => {
    await env.db
      .prepare(
        `INSERT INTO member_responses
          (response_id, form_id, revision_id, schema_hash, response_email, submitted_at,
           answers_json, raw_answers_json, extra_fields_json, unmapped_question_ids_json, search_text)
         VALUES ('r1', 'f1', 'v1', 'hash', 'm1@example.com', '2026-01-01T00:00:00Z',
           '{}', '{}', '{}', '[]', '')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
         VALUES ('r1', 'fullName', '"Form Name"', '"Form Name"')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_field_overrides
          (member_id, stable_key, value_json, raw_value_json, updated_by)
         VALUES ('m1', 'fullName', '"Admin Name"', '"Admin Name"', 'admin@example.com')`,
      )
      .run();

    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m1",
      {
        method: "GET",
        headers: await adminAuthHeader(),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      fields: Array<{
        stableKey: string;
        responseValue: unknown;
        overrideValue: unknown;
        effectiveValue: unknown;
        source: string;
      }>;
    };
    expect(body.fields).toContainEqual(
      expect.objectContaining({
        stableKey: "fullName",
        responseValue: "Form Name",
        overrideValue: "Admin Name",
        effectiveValue: "Admin Name",
        source: "admin",
      }),
    );
  });

  it("未知 stableKey は 400", async () => {
    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m1",
      {
        method: "PUT",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ stableKey: "__not_a_key__", value: "X" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("未存在 member は 404", async () => {
    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m_x",
      {
        method: "PUT",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ stableKey: "fullName", value: "X" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("value=null（明示クリア）も 200 で保存される", async () => {
    const res = await adminMemberFieldsRoute.request(
      "/member-fields/m1",
      {
        method: "PUT",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ stableKey: "occupation", value: null }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const row = await env.db
      .prepare(
        "SELECT value_json FROM member_field_overrides WHERE member_id='m1' AND stable_key='occupation'",
      )
      .first<{ value_json: string | null }>();
    expect(row?.value_json).toBe("null");
  });
});
