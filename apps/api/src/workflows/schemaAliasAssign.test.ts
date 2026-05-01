// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import {
  schemaAliasAssign,
  SchemaAliasAssignFailure,
  backfillResponseFields,
} from "./schemaAliasAssign";
import { adminEmail, asAdminId } from "../repository/_shared/brand";

const insertQuestion = async (
  db: InMemoryD1["db"],
  q: {
    questionPk: string;
    revisionId: string;
    stableKey: string;
    questionId: string;
    sectionKey?: string;
    position?: number;
    label?: string;
  },
) => {
  await db
    .prepare(
      `INSERT INTO schema_questions
       (question_pk, revision_id, stable_key, question_id, section_key, section_title, label, kind, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'text', ?)`,
    )
    .bind(
      q.questionPk,
      q.revisionId,
      q.stableKey,
      q.questionId,
      q.sectionKey ?? "profile",
      "Profile",
      q.label ?? "Some label",
      q.position ?? 1,
    )
    .run();
};

const insertResponseField = async (
  db: InMemoryD1["db"],
  responseId: string,
  stableKey: string,
  rawValueJson = "{}",
) => {
  await db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
       VALUES (?, ?, NULL, ?)`,
    )
    .bind(responseId, stableKey, rawValueJson)
    .run();
};

const baseInput = (overrides: Record<string, unknown> = {}) => ({
  questionId: "q1",
  stableKey: "full_name",
  dryRun: false,
  actorId: asAdminId("m_admin"),
  actorEmail: adminEmail("admin@example.com"),
  ...overrides,
});

describe("schemaAliasAssign", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await insertQuestion(env.db, {
      questionPk: "rev1:q1",
      revisionId: "rev1",
      stableKey: "unknown",
      questionId: "q1",
    });
  }, 30000);

  it("question_not_found → throws", async () => {
    await expect(
      schemaAliasAssign(env.ctx, baseInput({ questionId: "missing" })),
    ).rejects.toBeInstanceOf(SchemaAliasAssignFailure);
  });

  it("apply_updates_stable_key + queue resolved + audit recorded", async () => {
    // diff_queue にも 1 件投入
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d1','rev1','unresolved','q1',NULL,'Full name')`,
      )
      .run();

    const result = await schemaAliasAssign(
      env.ctx,
      baseInput({ diffId: "d1" }),
    );
    expect(result.mode).toBe("apply");
    if (result.mode !== "apply") throw new Error("type narrowing");
    expect(result.newStableKey).toBe("full_name");
    expect(result.queueStatus).toBe("resolved");

    const alias = await env.db
      .prepare("SELECT stable_key FROM schema_aliases WHERE alias_question_id = 'q1'")
      .first<{ stable_key: string }>();
    expect(alias?.stable_key).toBe("full_name");
    const q = await env.db
      .prepare("SELECT stable_key FROM schema_questions WHERE question_id = 'q1'")
      .first<{ stable_key: string }>();
    expect(q?.stable_key).toBe("unknown");

    const d = await env.db
      .prepare("SELECT status FROM schema_diff_queue WHERE diff_id = 'd1'")
      .first<{ status: string }>();
    expect(d?.status).toBe("resolved");

    const a = await env.db
      .prepare("SELECT count(*) AS c FROM audit_log WHERE action = 'schema_diff.alias_assigned'")
      .first<{ c: number }>();
    expect(a?.c).toBe(1);
  });

  it("dryRun_no_write", async () => {
    // 影響対象 extra field を 2 件投入
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r1','f1','rev1','h','2026-01-01T00:00:00Z','{}'),
                ('r2','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await insertResponseField(env.db, "r1", "__extra__:q1");
    await insertResponseField(env.db, "r2", "__extra__:q1");

    const result = await schemaAliasAssign(
      env.ctx,
      baseInput({ dryRun: true }),
    );
    expect(result.mode).toBe("dryRun");
    if (result.mode !== "dryRun") throw new Error();
    expect(result.affectedResponseFields).toBe(2);

    // DB 不変確認
    const q = await env.db
      .prepare("SELECT stable_key FROM schema_questions WHERE question_id = 'q1'")
      .first<{ stable_key: string }>();
    expect(q?.stable_key).toBe("unknown");
    const a = await env.db
      .prepare("SELECT count(*) AS c FROM audit_log")
      .first<{ c: number }>();
    expect(a?.c).toBe(0);
    const fields = await env.db
      .prepare("SELECT count(*) AS c FROM response_fields WHERE stable_key = '__extra__:q1'")
      .first<{ c: number }>();
    expect(fields?.c).toBe(2);
  });

  it("collision_422 (conflictExists in dryRun, throws on apply)", async () => {
    // 同 revision で他 questionId が同 stableKey 既使用
    await insertQuestion(env.db, {
      questionPk: "rev1:q2",
      revisionId: "rev1",
      stableKey: "full_name",
      questionId: "q2",
    });

    const dry = await schemaAliasAssign(
      env.ctx,
      baseInput({ dryRun: true }),
    );
    if (dry.mode !== "dryRun") throw new Error();
    expect(dry.conflictExists).toBe(true);
    expect(dry.currentStableKeyCount).toBe(1);

    await expect(
      schemaAliasAssign(env.ctx, baseInput()),
    ).rejects.toMatchObject({ detail: { kind: "collision" } });
  });

  it("idempotent_apply (same stableKey re-apply does not double-audit)", async () => {
    // 1 回目 apply
    await schemaAliasAssign(env.ctx, baseInput());
    // 2 回目 apply
    await schemaAliasAssign(env.ctx, baseInput());
    const a = await env.db
      .prepare("SELECT count(*) AS c FROM audit_log WHERE action = 'schema_diff.alias_assigned'")
      .first<{ c: number }>();
    expect(a?.c).toBe(1);
  });

  it("idempotent_apply_resolves_queued_diff_and_resumes_backfill", async () => {
    await insertQuestion(env.db, {
      questionPk: "rev0:q1",
      revisionId: "rev0",
      stableKey: "legacy_name",
      questionId: "q1",
    });
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d_idem','rev1','unresolved','q1',NULL,'Full name')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_resume','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await insertResponseField(env.db, "r_resume", "__extra__:q1");

    await schemaAliasAssign(env.ctx, baseInput());
    await env.db
      .prepare("UPDATE schema_diff_queue SET status = 'queued', resolved_by = NULL, resolved_at = NULL WHERE diff_id = 'd_idem'")
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_resume_2','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await insertResponseField(env.db, "r_resume_2", "__extra__:q1");

    const result = await schemaAliasAssign(
      env.ctx,
      baseInput({ diffId: "d_idem" }),
    );
    if (result.mode !== "apply") throw new Error();
    expect(result.affectedResponseFields).toBe(1);

    const d = await env.db
      .prepare("SELECT status FROM schema_diff_queue WHERE diff_id = 'd_idem'")
      .first<{ status: string }>();
    expect(d?.status).toBe("resolved");
    const legacy = await env.db
      .prepare("SELECT stable_key FROM schema_questions WHERE question_pk = 'rev0:q1'")
      .first<{ stable_key: string }>();
    expect(legacy?.stable_key).toBe("legacy_name");
    const a = await env.db
      .prepare("SELECT count(*) AS c FROM audit_log WHERE action = 'schema_diff.alias_assigned'")
      .first<{ c: number }>();
    expect(a?.c).toBe(1);
  });

  it("backfill batch loop (120 行)", async () => {
    // member_responses 120 行: batchSize=100 をまたぐことを検証する
    const stmts: Array<Promise<unknown>> = [];
    for (let i = 0; i < 120; i++) {
      stmts.push(
        env.db
          .prepare(
            `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
             VALUES (?, 'f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
          )
          .bind(`r${i}`)
          .run(),
      );
    }
    await Promise.all(stmts);
    for (let i = 0; i < 120; i++) {
      await insertResponseField(env.db, `r${i}`, "__extra__:q1");
    }

    const total = await backfillResponseFields(env.ctx, "q1", "full_name", 100);
    expect(total.updated).toBe(120);
    expect(total.status).toBe("completed");
    const remain = await env.db
      .prepare("SELECT count(*) AS c FROM response_fields WHERE stable_key = '__extra__:q1'")
      .first<{ c: number }>();
    expect(remain?.c).toBe(0);
    const updated = await env.db
      .prepare("SELECT count(*) AS c FROM response_fields WHERE stable_key = 'full_name'")
      .first<{ c: number }>();
    expect(updated?.c).toBe(120);
  });

  it("cpu budget exhausted returns retryable continuation and persists diff backfill state", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d_budget','rev1','unresolved','q1',NULL,'Full name')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_budget','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await insertResponseField(env.db, "r_budget", "__extra__:q1");

    const result = await schemaAliasAssign(
      env.ctx,
      baseInput({ diffId: "d_budget", backfillCpuBudgetMs: -1 }),
    );
    if (result.mode !== "apply") throw new Error();
    expect(result.backfill).toMatchObject({
      status: "exhausted",
      code: "backfill_cpu_budget_exhausted",
      retryable: true,
    });
    const d = await env.db
      .prepare("SELECT backfill_status, backfill_cursor FROM schema_diff_queue WHERE diff_id = 'd_budget'")
      .first<{ backfill_status: string; backfill_cursor: string | null }>();
    expect(d?.backfill_status).toBe("exhausted");
    expect(d?.backfill_cursor).toBe("0");
  });

  it("deleted_response_skip", async () => {
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_alive','f1','rev1','h','2026-01-01T00:00:00Z','{}'),
                ('r_dead','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await insertResponseField(env.db, "r_alive", "__extra__:q1");
    await insertResponseField(env.db, "r_dead", "__extra__:q1");
    // member_identities に r_dead を current_response_id として登録し、
    // deleted_members で論理削除を表現する
    await env.db
      .prepare(
        `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m_dead','dead@example.com','r_dead','r_dead','2026-01-01T00:00:00Z')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO deleted_members (member_id, deleted_by, deleted_at)
         VALUES ('m_dead','admin','2026-01-01T00:00:00Z')`,
      )
      .run();

    const result = await schemaAliasAssign(env.ctx, baseInput());
    if (result.mode !== "apply") throw new Error();
    expect(result.affectedResponseFields).toBe(1);
    const dead = await env.db
      .prepare(
        "SELECT stable_key FROM response_fields WHERE response_id = 'r_dead'",
      )
      .first<{ stable_key: string }>();
    expect(dead?.stable_key).toBe("__extra__:q1");
  });

  it("diff_question_mismatch → 409", async () => {
    await env.db
      .prepare(
        `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label)
         VALUES ('d2','rev1','unresolved','other_q',NULL,'X')`,
      )
      .run();
    await expect(
      schemaAliasAssign(env.ctx, baseInput({ diffId: "d2" })),
    ).rejects.toMatchObject({ detail: { kind: "diff_question_mismatch" } });
  });
});
