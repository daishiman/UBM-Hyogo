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
import {
  runBackfillBatch,
  resolveBackfillCursorMode,
  resolveBackfillCursorModeWithLog,
  RETRY_COUNT_LIMIT,
} from "./schemaAliasBackfillBatch";
import { findById, getBackfillCursor } from "../repository/schemaDiffQueue";

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

  describe("Issue #503: shadow flag (BACKFILL_CURSOR_MODE)", () => {
    it("resolveBackfillCursorMode: 値域", () => {
      expect(resolveBackfillCursorMode(undefined)).toBe("remaining-scan");
      expect(resolveBackfillCursorMode(null)).toBe("remaining-scan");
      expect(resolveBackfillCursorMode("")).toBe("remaining-scan");
      expect(resolveBackfillCursorMode("remaining-scan")).toBe("remaining-scan");
      expect(resolveBackfillCursorMode("cursor")).toBe("cursor");
      // 不正値は default fallback
      expect(resolveBackfillCursorMode("CURSOR")).toBe("remaining-scan");
      expect(resolveBackfillCursorMode("typo")).toBe("remaining-scan");
    });

    it("resolveBackfillCursorModeWithLog: 不正値で warn log", () => {
      const warns: string[] = [];
      const orig = console.warn;
      console.warn = (m: string) => warns.push(m);
      try {
        const got = resolveBackfillCursorModeWithLog("nope");
        expect(got).toBe("remaining-scan");
        expect(warns.length).toBe(1);
        expect(warns[0]).toContain("BACKFILL_CURSOR_MODE invalid value");
      } finally {
        console.warn = orig;
      }
    });

    it("cursor mode: 残件なし → completed", async () => {
      await seedDiff(env, "d_cursor_complete", "qCC");
      const r = await runBackfillBatch(env.ctx, {
        diffId: "d_cursor_complete",
        questionId: "qCC",
        newStableKey: "cc_key",
        mode: "cursor",
      });
      expect(r.status).toBe("completed");
      expect(r.needsReEnqueue).toBe(false);
      expect(r.remaining).toBe(0);
      const row = await findById(env.ctx, "d_cursor_complete");
      expect(row?.backfillStatus).toBe("completed");
    });

    it("cursor mode: 通常実行で remaining=0 + cursor 列が null に戻る", async () => {
      await seedDiff(env, "d_cursor_run", "qCR");
      await env.db
        .prepare(
          `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
           VALUES ('r_c1','f1','rev1','h','2026-01-01T00:00:00Z','{}'),
                  ('r_c2','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
        )
        .run();
      await env.db
        .prepare(
          `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
           VALUES ('r_c1','__extra__:qCR',NULL,'{}'),
                  ('r_c2','__extra__:qCR',NULL,'{}')`,
        )
        .run();
      const r = await runBackfillBatch(env.ctx, {
        diffId: "d_cursor_run",
        questionId: "qCR",
        newStableKey: "cr_key",
        maxBatchRows: 100,
        mode: "cursor",
      });
      expect(r.status).toBe("completed");
      expect(r.remaining).toBe(0);
      // completed 時は cursor=null が書かれる（recordBatchProgress の completed branch）
      const cur = await getBackfillCursor(env.ctx, "d_cursor_run");
      expect(cur).toBeNull();
    });

    it("cursor mode: CPU budget 枯渇 → exhausted + cursor 進行", async () => {
      await seedDiff(env, "d_cursor_busy", "qCB");
      await env.db
        .prepare(
          `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
           VALUES ('r_cb','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
        )
        .run();
      await env.db
        .prepare(
          `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
           VALUES ('r_cb','__extra__:qCB',NULL,'{}')`,
        )
        .run();
      const r = await runBackfillBatch(env.ctx, {
        diffId: "d_cursor_busy",
        questionId: "qCB",
        newStableKey: "cb_key",
        cpuBudgetMs: -1,
        mode: "cursor",
      });
      expect(r.status).toBe("exhausted");
      expect(r.needsReEnqueue).toBe(true);
      expect(r.retryCount).toBe(1);
      const row = await findById(env.ctx, "d_cursor_busy");
      expect(row?.backfillStatus).toBe("exhausted");
    });

    it("cursor mode: stale cursor 以下の残件がある場合は cursor を reset して再実行で回収する", async () => {
      await seedDiff(env, "d_cursor_stale", "qCS");
      await env.db
        .prepare(
          "UPDATE schema_diff_queue SET backfill_cursor = 'r_z' WHERE diff_id = 'd_cursor_stale'",
        )
        .run();
      await env.db
        .prepare(
          `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
           VALUES ('r_a','f1','rev1','h','2026-01-01T00:00:00Z','{}')`,
        )
        .run();
      await env.db
        .prepare(
          `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
           VALUES ('r_a','__extra__:qCS',NULL,'{}')`,
        )
        .run();

      const first = await runBackfillBatch(env.ctx, {
        diffId: "d_cursor_stale",
        questionId: "qCS",
        newStableKey: "cs_key",
        mode: "cursor",
      });
      expect(first.status).toBe("exhausted");
      expect(first.remaining).toBe(1);
      expect(await getBackfillCursor(env.ctx, "d_cursor_stale")).toBeNull();

      const second = await runBackfillBatch(env.ctx, {
        diffId: "d_cursor_stale",
        questionId: "qCS",
        newStableKey: "cs_key",
        mode: "cursor",
        retryCount: first.retryCount,
      });
      expect(second.status).toBe("completed");
      expect(second.remaining).toBe(0);
    });

    it("cursor mode: API contract `backfill.status` 値域に cursor が露出しない", async () => {
      await seedDiff(env, "d_contract", "qCT");
      const r = await runBackfillBatch(env.ctx, {
        diffId: "d_contract",
        questionId: "qCT",
        newStableKey: "ct_key",
        mode: "cursor",
      });
      // BackfillBatchResult.status は public 値域
      expect(["running", "exhausted", "completed", "failed"]).toContain(r.status);
      // cursor 概念がレスポンスに現れない
      expect(Object.keys(r)).not.toContain("cursor");
      expect(Object.keys(r)).not.toContain("nextCursor");
    });
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
