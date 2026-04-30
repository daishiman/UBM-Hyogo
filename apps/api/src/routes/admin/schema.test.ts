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
    const body = (await res.json()) as { mode: string; queueStatus?: string };
    expect(body.mode).toBe("apply");
  });

  it("POST aliases?dryRun=true: 書き込みなし", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases?dryRun=true",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "q1", stableKey: "full_name" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string };
    expect(body.mode).toBe("dryRun");
    const q = await env.db
      .prepare("SELECT stable_key FROM schema_questions WHERE question_id = 'q1'")
      .first<{ stable_key: string }>();
    expect(q?.stable_key).toBe("unknown");
  });

  it("POST aliases: collision で 422", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_questions
         (question_pk, revision_id, stable_key, question_id, section_key, section_title, label, kind, position)
         VALUES ('rev1:q2','rev1','full_name','q2','profile','Profile','Other','text',2)`,
      )
      .run();
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
    expect(res.status).toBe(422);
  });

  it("POST aliases: stableKey regex 違反で 400", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "q1", stableKey: "1bad" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("GET diff: recommendedStableKeys が同梱される", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_questions
         (question_pk, revision_id, stable_key, question_id, section_key, section_title, label, kind, position)
         VALUES ('rev1:q_existing','rev1','full_name','q_ex','profile','Profile','Full name','text',1)`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d_x','rev1','unresolved','q1',NULL,'Full name')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/diff",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ recommendedStableKeys: string[] }>;
    };
    expect(Array.isArray(body.items[0]?.recommendedStableKeys)).toBe(true);
    expect(body.items[0]?.recommendedStableKeys).toContain("full_name");
  });
});
