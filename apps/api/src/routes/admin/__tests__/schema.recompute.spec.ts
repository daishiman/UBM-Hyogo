// @vitest-environment node
// Issue #836 (T-06〜T-11): POST/GET /admin/schema/aliases/:aliasId/recompute の contract / behavior 検証
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
    version: number;
    deletedAt: string | null;
  }> = {},
) => {
  const o = {
    revisionId: "rev1",
    stableKey: "full_name",
    aliasQuestionId: "q1",
    version: 2,
    deletedAt: "2026-05-19T01:00:00.000Z" as string | null,
    ...overrides,
  };
  await env.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at, deleted_at, deleted_by, version)
       VALUES (?, ?, ?, ?, 'Full name', 'manual', 'admin@example.com', '2026-05-19T00:00:00.000Z', ?, ?, ?)`,
    )
    .bind(
      id,
      o.revisionId,
      o.stableKey,
      o.aliasQuestionId,
      o.deletedAt,
      o.deletedAt ? "admin@example.com" : null,
      o.version,
    )
    .run();
};

const insertResponseField = async (
  env: InMemoryD1,
  responseId: string,
  stableKey: string,
) => {
  await env.db
    .prepare(
      `INSERT OR IGNORE INTO member_responses
       (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
       VALUES (?, 'f1', 'rev1', 'h', '2026-01-01T00:00:00Z', '{}')`,
    )
    .bind(responseId)
    .run();
  await env.db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
       VALUES (?, ?, NULL, '{}')`,
    )
    .bind(responseId, stableKey)
    .run();
};

const postRecompute = async (
  env: InMemoryD1,
  aliasId: string,
  body: Record<string, unknown> = {},
) => {
  const app = createAdminSchemaRoute();
  return app.request(
    `/schema/aliases/${aliasId}/recompute`,
    {
      method: "POST",
      headers: {
        ...(await adminAuthHeader()),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    makeEnv(env),
  );
};

describe("admin schema recompute route", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("T-06: POST happy → 200 で recompute result を返す", async () => {
    await insertAlias(env, "a-ok");
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");

    const res = await postRecompute(env, "a-ok", { reason: "operator typo" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      jobId: string;
      aliasId: string;
      status: string;
      affectedCount: number;
      processedCount: number;
      recomputeAuditId: string;
      relatedRollbackAuditId: string | null;
    };
    expect(body.aliasId).toBe("a-ok");
    expect(body.status).toBe("completed");
    expect(body.affectedCount).toBe(2);
    expect(body.processedCount).toBe(2);
    expect(body.jobId).toBeTruthy();
    expect(body.recomputeAuditId).toBeTruthy();
  });

  it("T-07: 同 alias へ 2 回 POST → 同一 jobId・__extra__ 件数不変", async () => {
    await insertAlias(env, "a-idem");
    await insertResponseField(env, "r1", "full_name");

    const first = (await (await postRecompute(env, "a-idem")).json()) as {
      jobId: string;
    };
    const second = (await (await postRecompute(env, "a-idem")).json()) as {
      jobId: string;
    };
    expect(second.jobId).toBe(first.jobId);
    const extra = await env.db
      .prepare(
        `SELECT COUNT(*) AS c FROM response_fields WHERE stable_key = '__extra__:q1'`,
      )
      .first<{ c: number }>();
    expect(Number(extra?.c ?? 0)).toBe(1);
  });

  it("T-08: 存在しない aliasId → 404 not_found", async () => {
    const res = await postRecompute(env, "missing");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  it("T-09: 未 rollback（deleted_at IS NULL）の alias → 409 not_rolled_back", async () => {
    await insertAlias(env, "a-live", { deletedAt: null });
    const res = await postRecompute(env, "a-live");
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_rolled_back");
  });

  it("T-10: GET status は job を返し、job 不在 alias は body null", async () => {
    await insertAlias(env, "a-st");
    await insertResponseField(env, "r1", "full_name");
    await postRecompute(env, "a-st");

    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-st/recompute",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      jobId: string;
      status: string;
      processedCount: number;
      lastError: string | null;
      updatedAt: string;
    } | null;
    expect(body?.status).toBe("completed");
    expect(body?.processedCount).toBe(1);

    const none = await app.request(
      "/schema/aliases/no-job/recompute",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(none.status).toBe(200);
    expect(await none.json()).toBeNull();
  });

  it("T-11: recompute 200 後に audit_log へ schema_alias.recompute 行が記録される", async () => {
    await insertAlias(env, "a-aud");
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");
    await postRecompute(env, "a-aud", { reason: "operator typo" });

    const audit = await env.db
      .prepare(
        `SELECT action, after_json FROM audit_log
         WHERE target_type = 'schema_alias' AND target_id = 'a-aud'
           AND action = 'schema_alias.recompute'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .first<{ action: string; after_json: string }>();
    expect(audit?.action).toBe("schema_alias.recompute");
    const after = JSON.parse(audit?.after_json ?? "{}") as {
      jobId?: string;
      affectedCount?: number;
      processedCount?: number;
      relatedRollbackAuditId?: string | null;
      reason?: string | null;
    };
    expect(after.jobId).toBeTruthy();
    expect(after.affectedCount).toBe(2);
    expect(after.processedCount).toBe(2);
    expect(after.reason).toBe("operator typo");
    expect("relatedRollbackAuditId" in after).toBe(true);
  });
});
