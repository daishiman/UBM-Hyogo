// @vitest-environment node
// Branch-coverage recovery for apps/api/src/routes/admin/schema.ts
// Targets uncovered if/else, ternary, ??, ?., catch, early-return paths in the
// rollback / recompute / backfill / aliases / diff endpoints.
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminSchemaRoute } from "./schema";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

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
    version: number;
    deletedAt: string | null;
  }> = {},
) => {
  const o = {
    revisionId: "rev1",
    stableKey: "full_name",
    aliasQuestionId: "q1",
    aliasLabel: "Full name",
    version: 1,
    deletedAt: null as string | null,
    ...overrides,
  };
  await env.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at, deleted_at, deleted_by, version)
       VALUES (?, ?, ?, ?, ?, 'manual', 'admin@example.com', '2026-05-19T00:00:00.000Z', ?, ?, ?)`,
    )
    .bind(
      id,
      o.revisionId,
      o.stableKey,
      o.aliasQuestionId,
      o.aliasLabel,
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

describe("admin schema route — branch recovery", () => {
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
  }, 120000);

  // ── GET /schema/diff: empty-result fallbacks ───────────────────────────────
  // line 116 (results ?? []), line 124 (!d.questionId continue),
  // line 134 (detail truthy), line 211/210 (it.questionId ternary)
  it("GET diff: diff with NULL question_id yields empty recommendedStableKeys", async () => {
    // existing schema_question with a real stable_key drives buildRecommendations'
    // SELECT (non-empty existing list), exercising line 116 results branch.
    await env.db
      .prepare(
        `INSERT INTO schema_questions
         (question_pk, revision_id, stable_key, question_id, section_key, section_title, label, kind, position)
         VALUES ('rev1:qe','rev1','phone','q_e','contact','Contact','Phone','text',2)`,
      )
      .run();
    // diff row with NULL question_id → continue branch (line 124) + ternary [] (line 211)
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d_null','rev1','unresolved',NULL,NULL,'No question id')`,
      )
      .run();
    // diff row whose question_id has NO schema_questions detail row → detail falsy (line 134 else)
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d_nodetail','rev1','unresolved','q_missing',NULL,'Orphan label')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/diff",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ questionId: string | null; recommendedStableKeys: string[] }>;
    };
    const nullItem = body.items.find((i) => i.questionId === null);
    expect(nullItem?.recommendedStableKeys).toEqual([]);
    const orphan = body.items.find((i) => i.questionId === "q_missing");
    expect(Array.isArray(orphan?.recommendedStableKeys)).toBe(true);
  });

  // ── POST /schema/aliases: invalid JSON → 400 (line 237 catch) ──────────────
  it("POST aliases: invalid JSON body → 400 invalid json", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: "{not json",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid json");
  });

  // ── POST /schema/aliases: question_not_found → 404 (failureToHttp line 163) ─
  it("POST aliases: unknown questionId → 404 question not found", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "does_not_exist", stableKey: "full_name" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("question not found");
  });

  // ── POST /schema/aliases: diff_not_found → 404 (failureToHttp line 165) ─────
  it("POST aliases with unknown diffId → 404 diff not found", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({
          questionId: "q1",
          stableKey: "full_name",
          diffId: "diff_missing",
        }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("diff not found");
  });

  // ── POST /schema/aliases: diff_question_mismatch → 409 (line 167) ──────────
  it("POST aliases: diffId whose question differs → 409 diff question mismatch", async () => {
    // diff exists but references a different question_id than the one in body
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label, status)
         VALUES ('d_mismatch','rev1','unresolved','q_other',NULL,'Other','queued')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({
          questionId: "q1",
          stableKey: "full_name",
          diffId: "d_mismatch",
        }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("diff question mismatch");
  });

  // ── POST /schema/aliases: apply + diffId + exhausted → enqueue branch ───────
  // lines 283/285 (diffId && exhausted), 287 enqueueBackfill, 312 enqueueInfo ternary
  it("POST aliases: apply with diffId + CPU exhausted enqueues backfill (202)", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label, status, suggested_stable_key)
         VALUES ('d_enq','rev1','unresolved','q1',NULL,'Full name','queued','full_name')`,
      )
      .run();
    await insertResponseField(env, "r_enq", "__extra__:q1");
    const sent: unknown[] = [];
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "q1", stableKey: "full_name", diffId: "d_enq" }),
      },
      makeEnv(env, {
        UT07B_BACKFILL_CPU_BUDGET_MS: "-1",
        SCHEMA_ALIAS_BACKFILL_QUEUE: {
          send: async (m: unknown) => {
            sent.push(m);
          },
        },
      }),
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      confirmed?: boolean;
      backfill?: { status: string; dedupeKey?: string; enqueued?: boolean };
    };
    expect(body.confirmed).toBe(true);
    expect(body.backfill?.status).toBe("exhausted");
    // enqueueInfo ternary populated dedupeKey/enqueued (line 312)
    expect(typeof body.backfill?.dedupeKey).toBe("string");
  });

  // ── POST /schema/aliases: invalid CPU budget value → null branch (line 253) ─
  it("POST aliases: non-numeric CPU budget env is ignored (200 apply)", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ questionId: "q1", stableKey: "full_name" }),
      },
      makeEnv(env, { UT07B_BACKFILL_CPU_BUDGET_MS: "not-a-number" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string };
    expect(body.mode).toBe("apply");
  });

  // ── POST /schema/backfill/trigger: invalid JSON falls back to {} (line 345) ─
  it("POST backfill/trigger: invalid JSON body falls back to empty + default source", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/backfill/trigger",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: "}{ broken",
      },
      makeEnv(env, { ENVIRONMENT: "staging" }),
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      source: string;
      selected: number;
      queueBindingPresent: boolean;
    };
    // parsed.data.source ?? default (line 381)
    expect(body.source).toBe("issue-504-50k-trial");
    expect(body.selected).toBe(0);
    // no queue binding present → Boolean(undefined) === false (line 385)
    expect(body.queueBindingPresent).toBe(false);
  });

  // ── POST /schema/backfill/trigger: rows with NULL fields skipped (line 365) ─
  it("POST backfill/trigger: rows are selected and enqueued (no queue binding)", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue
          (diff_id, revision_id, type, question_id, label, suggested_stable_key, status, dedupe_key)
         VALUES ('fx-1','rev1','unresolved','q1','Full name','full_name','queued','ubm-test-fixture-50k-1-a')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/backfill/trigger",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      // staging, but NO SCHEMA_ALIAS_BACKFILL_QUEUE binding → queueProducer null (line 92)
      makeEnv(env, { ENVIRONMENT: "staging" }),
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      selected: number;
      queueEnqueued: number;
      alreadyEnqueued: number;
      queueBindingPresent: boolean;
    };
    expect(body.selected).toBe(1);
    expect(body.queueBindingPresent).toBe(false);
  });

  // ── POST rollback: aliasId param present but bad body JSON → {} (line 415) ──
  it("POST rollback: invalid JSON body still parses as empty object (404 path)", async () => {
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
        body: "{bad",
      },
      makeEnv(env),
    );
    // empty body parses ok → proceeds to rollback → alias missing → 404
    expect(res.status).toBe(404);
  });

  // ── POST rollback: reason > 500 chars → 400 bad_request (line 418) ─────────
  it("POST rollback: oversized reason → 400 bad_request", async () => {
    await insertAlias(env, "a-long");
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-long/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "x".repeat(501) }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("bad_request");
  });

  // ── POST rollback: malformed If-Match → 400 (parseIfMatch lines 57/59) ─────
  it("POST rollback: If-Match without version=<N> → 400", async () => {
    await insertAlias(env, "a-badmatch");
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-badmatch/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "garbage",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  // ── POST rollback: negative version in If-Match → 400 (parseIfMatch line 59) ─
  it("POST rollback: If-Match version negative → 400", async () => {
    await insertAlias(env, "a-neg");
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-neg/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=-5",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  // ── POST rollback: notification dispatch via Slack webhook env (line 440/466)
  it("POST rollback: 200 with SLACK_WEBHOOK_URL fallback exercises notification env branches", async () => {
    await insertAlias(env, "a-notif", { aliasQuestionId: "q-notif", version: 1 });
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-notif/rollback",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "If-Match": "version=1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "cleanup" }),
      },
      // SLACK_WEBHOOK_INCIDENT absent → ?? SLACK_WEBHOOK_URL (line 439)
      // MAIL_PROVIDER_KEY present → createResendSender branch (line 440)
      makeEnv(env, {
        SLACK_WEBHOOK_URL: "https://hooks.example.com/test",
        MAIL_PROVIDER_KEY: "re_test_key",
        MAIL_FROM_ADDRESS: "noreply@example.com",
        OPS_NOTIFICATION_EMAIL: "ops@example.com",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { aliasId: string };
    expect(body.aliasId).toBe("a-notif");
  });

  // ── POST recompute: invalid JSON → {} then proceeds (line 485) ─────────────
  it("POST recompute: invalid JSON body falls back to empty object (404 path)", async () => {
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/missing/recompute",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: "{nope",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  // ── POST recompute: oversized reason → 400 bad_request (line 489) ──────────
  it("POST recompute: oversized reason → 400 bad_request", async () => {
    await insertAlias(env, "a-rc-long", { deletedAt: "2026-05-19T01:00:00.000Z" });
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-rc-long/recompute",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ reason: "y".repeat(501) }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("bad_request");
  });

  // ── POST recompute: not_rolled_back → 409 (failure mapping line 512) ───────
  it("POST recompute: alias not rolled back → 409 not_rolled_back", async () => {
    await insertAlias(env, "a-rc-live", { deletedAt: null });
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/a-rc-live/recompute",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_rolled_back");
  });

  // ── GET recompute: job present → full body (line 525 else) ─────────────────
  it("GET recompute: returns latest job after a recompute run", async () => {
    await insertAlias(env, "a-rc-get", { deletedAt: "2026-05-19T01:00:00.000Z" });
    await insertResponseField(env, "r_rc", "full_name");
    const app = createAdminSchemaRoute();
    // drive a recompute so a job row exists
    const post = await app.request(
      "/schema/aliases/a-rc-get/recompute",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(post.status).toBe(200);
    const res = await app.request(
      "/schema/aliases/a-rc-get/recompute",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      jobId: string;
      aliasId: string;
      status: string;
    } | null;
    expect(body?.aliasId).toBe("a-rc-get");
    expect(body?.jobId).toBeTruthy();
  });

  // ── GET backfill: status fallback variants (lines 553/558/559/560/573) ─────
  it("GET backfill: completed status → public completed", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label, backfill_status, retry_count)
         VALUES ('d_done','rev1','unresolved','q1','Full name','completed',0)`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/d_done/backfill",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { backfill: { status: string } };
    expect(body.backfill.status).toBe("completed");
  });

  it("GET backfill: in_progress status → public running", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label, backfill_status, retry_count)
         VALUES ('d_run','rev1','unresolved','q1','Full name','in_progress',1)`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/d_run/backfill",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { backfill: { status: string } };
    expect(body.backfill.status).toBe("running");
  });

  it("GET backfill: NULL/unknown status → public pending + failedItemsJson empty (line 573)", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label, retry_count)
         VALUES ('d_pending','rev1','unresolved','q1','Full name',0)`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/d_pending/backfill",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      backfill: { status: string; failedItems: unknown[] };
    };
    expect(body.backfill.status).toBe("pending");
    // failedItemsJson NULL → [] (line 573 false branch)
    expect(body.backfill.failedItems).toEqual([]);
  });

  it("GET backfill: failedItemsJson populated → parsed array (line 573 true branch)", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label, backfill_status, retry_count, failed_items_json)
         VALUES ('d_failedjson','rev1','unresolved','q1','Full name','failed',3,'[{"responseId":"r9"}]')`,
      )
      .run();
    const app = createAdminSchemaRoute();
    const res = await app.request(
      "/schema/aliases/d_failedjson/backfill",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      backfill: { status: string; failedItems: Array<{ responseId: string }> };
    };
    expect(body.backfill.status).toBe("exhausted");
    expect(body.backfill.failedItems[0]?.responseId).toBe("r9");
  });
});
