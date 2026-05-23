// @vitest-environment node
// Issue #778: POST /admin/schema/aliases/:aliasId/rollback の contract / behavior 検証
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createAdminSchemaRoute } from "../schema";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../_test-auth";

const makeEnv = (env: InMemoryD1, overrides: Record<string, unknown> = {}) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
  ...overrides,
});

const insertAlias = async (
  env: InMemoryD1,
  id: string,
  overrides: Partial<{
    revisionId: string;
    stableKey: string;
    aliasQuestionId: string;
    aliasLabel: string;
    source: string;
    resolvedBy: string;
    resolvedAt: string;
    version: number;
    deletedAt: string | null;
  }> = {},
) => {
  const o = {
    revisionId: "rev1",
    stableKey: "full_name",
    aliasQuestionId: "q1",
    aliasLabel: "Full name",
    source: "manual",
    resolvedBy: "admin@example.com",
    resolvedAt: "2026-05-19T00:00:00.000Z",
    version: 1,
    deletedAt: null as string | null,
    ...overrides,
  };
  await env.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at, deleted_at, deleted_by, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      o.revisionId,
      o.stableKey,
      o.aliasQuestionId,
      o.aliasLabel,
      o.source,
      o.resolvedBy,
      o.resolvedAt,
      o.deletedAt,
      o.deletedAt ? "admin@example.com" : null,
      o.version,
    )
    .run();
};

describe("admin schema rollback route", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("401 when unauthenticated", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-1/rollback",
      {
        method: "POST",
        headers: { "If-Match": "version=1", "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("400 when If-Match header missing", async () => {
    await insertAlias(env, "a-1");
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-1/rollback",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("bad_request");
  });

  it("404 when alias not found", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/missing/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  it("404 already_deleted when alias already soft-deleted", async () => {
    await insertAlias(env, "a-del", { deletedAt: "2026-05-19T01:00:00.000Z" });
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-del/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("already_deleted");
  });

  it("409 version_mismatch when expectedVersion differs", async () => {
    await insertAlias(env, "a-v", { version: 3 });
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue
         (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, resolved_by, resolved_at, created_at)
         VALUES ('d-v','rev1','added','q1',NULL,'Q','full_name','resolved','admin@example.com','2026-05-19T00:00:00.000Z','2026-05-19T00:00:00.000Z')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-v/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("version_mismatch");

    const alias = await env.db
      .prepare("SELECT deleted_at, version FROM schema_aliases WHERE id = 'a-v'")
      .first<{ deleted_at: string | null; version: number }>();
    expect(alias?.deleted_at).toBeNull();
    expect(alias?.version).toBe(3);
    const queue = await env.db
      .prepare("SELECT status FROM schema_diff_queue WHERE diff_id = 'd-v'")
      .first<{ status: string }>();
    expect(queue?.status).toBe("resolved");
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS c FROM audit_log WHERE target_id = 'a-v'")
      .first<{ c: number }>();
    expect(audit?.c).toBe(0);
  });

  it("200 successful rollback: soft-deletes alias, restores diff queue, writes audit_log", async () => {
    await insertAlias(env, "a-ok", { aliasQuestionId: "q-ok", version: 1 });
    // schema_diff_queue row in resolved state
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue
         (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, resolved_by, resolved_at, created_at)
         VALUES ('d-ok','rev1','added','q-ok',NULL,'Q','full_name','resolved','admin@example.com','2026-05-19T00:00:00.000Z','2026-05-19T00:00:00.000Z')`,
      )
      .run();

    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-ok/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "operator typo" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      aliasId: string;
      newVersion: number;
      relatedAuditId: string | null;
      rolledBackAt: string;
      impact: { affectedResponseCount: number; recomputeRequired: boolean };
    };
    expect(body.aliasId).toBe("a-ok");
    expect(body.newVersion).toBe(2);
    expect(body.impact.affectedResponseCount).toBe(0);
    expect(body.impact.recomputeRequired).toBe(false);

    // schema_aliases.deleted_at, version 反映
    const row = await env.db
      .prepare(
        `SELECT deleted_at, deleted_by, version FROM schema_aliases WHERE id = 'a-ok'`,
      )
      .first<{ deleted_at: string | null; deleted_by: string | null; version: number }>();
    expect(row?.deleted_at).toBeTruthy();
    expect(row?.deleted_by).toBe("admin@example.com");
    expect(row?.version).toBe(2);

    // schema_diff_queue が queued に巻き戻った
    const dq = await env.db
      .prepare(
        `SELECT status FROM schema_diff_queue WHERE diff_id = 'd-ok'`,
      )
      .first<{ status: string }>();
    expect(dq?.status).toBe("queued");

    // audit_log に rollback 記録
    const audit = await env.db
      .prepare(
        `SELECT action, after_json FROM audit_log WHERE target_type = 'schema_alias' AND target_id = 'a-ok' ORDER BY created_at DESC LIMIT 1`,
      )
      .first<{ action: string; after_json: string }>();
    expect(audit?.action).toBe("schema_alias.rollback");
    const after = JSON.parse(audit?.after_json ?? "{}") as {
      reason?: string;
      rolledBackAt?: string;
      relatedAuditId?: string | null;
    };
    expect(after.reason).toBe("operator typo");
    expect(after.rolledBackAt).toBeTruthy();
  });

  it("impact: response_fields の件数を返す", async () => {
    await insertAlias(env, "a-imp", {
      stableKey: "phone",
      aliasQuestionId: "q-imp",
    });
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r1','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
         VALUES ('r1','phone',NULL,'{}')`,
      )
      .run();

    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-imp/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      impact: { affectedResponseCount: number; recomputeRequired: boolean };
    };
    expect(body.impact.affectedResponseCount).toBe(1);
    expect(body.impact.recomputeRequired).toBe(true);
  });
});
