// @vitest-environment node
// UT-07B-FU-01: schemaAliasBackfillBatch workflow tests
//
// 観点:
//  - 残件 0 → completed
//  - CPU budget 枯渇 → exhausted + retry_count++
//  - retry_count >= 5 → failed（needsReEnqueue=false）
//  - failed_items_json + last_error 永続化
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import { runBackfillBatch, RETRY_COUNT_LIMIT } from "./schemaAliasBackfillBatch";
import { findById } from "../repository/schemaDiffQueue";

const seedDiff = async (
  env: InMemoryD1,
  diffId: string,
  questionId: string,
  retryCount = 0,
) => {
  await env.db
    .prepare(
      `INSERT INTO schema_diff_queue
        (diff_id, revision_id, type, question_id, label, retry_count)
       VALUES (?, 'rev1', 'unresolved', ?, 'L', ?)`,
    )
    .bind(diffId, questionId, retryCount)
    .run();
};

describe("schemaAliasBackfillBatch", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("残件なし → completed / needsReEnqueue=false", async () => {
    await seedDiff(env, "d_complete", "qC");
    const r = await runBackfillBatch(env.ctx, {
      diffId: "d_complete",
      questionId: "qC",
      newStableKey: "complete_key",
    });
    expect(r.status).toBe("completed");
    expect(r.needsReEnqueue).toBe(false);
    expect(r.remaining).toBe(0);
    const row = await findById(env.ctx, "d_complete");
    expect(row?.backfillStatus).toBe("completed");
  });

  it("CPU budget 枯渇 → exhausted + retry_count++ + needsReEnqueue=true", async () => {
    await seedDiff(env, "d_busy", "qB");
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_x','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
         VALUES ('r_x','__extra__:qB',NULL,'{}')`,
      )
      .run();
    const r = await runBackfillBatch(env.ctx, {
      diffId: "d_busy",
      questionId: "qB",
      newStableKey: "busy_key",
      cpuBudgetMs: -1,
    });
    expect(r.status).toBe("exhausted");
    expect(r.needsReEnqueue).toBe(true);
    expect(r.retryCount).toBe(1);
    const row = await findById(env.ctx, "d_busy");
    expect(row?.backfillStatus).toBe("exhausted");
    expect(row?.retryCount).toBe(1);
  });

  it("retry_count 上限超過 → failed / needsReEnqueue=false", async () => {
    await seedDiff(env, "d_lim", "qL", RETRY_COUNT_LIMIT - 1);
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_y','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
         VALUES ('r_y','__extra__:qL',NULL,'{}')`,
      )
      .run();
    const r = await runBackfillBatch(env.ctx, {
      diffId: "d_lim",
      questionId: "qL",
      newStableKey: "lim_key",
      cpuBudgetMs: -1,
      retryCount: RETRY_COUNT_LIMIT - 1,
    });
    expect(r.status).toBe("failed");
    expect(r.needsReEnqueue).toBe(false);
    expect(r.retryCount).toBeGreaterThanOrEqual(RETRY_COUNT_LIMIT);
    const row = await findById(env.ctx, "d_lim");
    expect(row?.backfillStatus).toBe("failed");
  });

  it("二重実行で remaining-scan は単調減少（idempotent）", async () => {
    await seedDiff(env, "d_idem", "qI");
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r_a','f1','rev1','h','2026-01-01T00:00:00Z','{}'),
                ('r_b','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
         VALUES ('r_a','__extra__:qI',NULL,'{}'),
                ('r_b','__extra__:qI',NULL,'{}')`,
      )
      .run();
    const r1 = await runBackfillBatch(env.ctx, {
      diffId: "d_idem",
      questionId: "qI",
      newStableKey: "idem_key",
      maxBatchRows: 100,
    });
    expect(r1.status).toBe("completed");
    // 2 度目は no-op（remaining=0）
    const r2 = await runBackfillBatch(env.ctx, {
      diffId: "d_idem",
      questionId: "qI",
      newStableKey: "idem_key",
      maxBatchRows: 100,
    });
    expect(r2.status).toBe("completed");
    expect(r2.remaining).toBe(0);
  });
});
