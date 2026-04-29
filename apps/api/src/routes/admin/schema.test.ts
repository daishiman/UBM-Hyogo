// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminSchemaRoute } from "./schema";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("admin schema route", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        `INSERT INTO schema_questions
         (question_pk, revision_id, stable_key, question_id, section_key, section_title, label, kind, position)
         VALUES ('rev1:q1','rev1','unknown','q1','profile','Profile','Full name','text',1)`,
      )
      .run();
  }, 30000);

  it("authz: GET diff 401", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request("/schema/diff", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("GET diff: 200 + items 配列", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/diff",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("POST aliases: body 不正で 400", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("POST aliases: 正常 200", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "q1", stableKey: "full_name" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  });
});
