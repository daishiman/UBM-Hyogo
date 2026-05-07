// @vitest-environment node
// UT-07B-FU-01: enqueueBackfill — dedupe_key reservation + producer.send
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import { findById } from "../repository/schemaDiffQueue";
import { enqueueBackfill } from "./schemaAliasEnqueue";

const seedDiff = async (env: InMemoryD1, diffId: string) => {
  await env.db
    .prepare(
      `INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label)
       VALUES (?, 'rev1', 'unresolved', 'q1', 'L')`,
    )
    .bind(diffId)
    .run();
};

describe("enqueueBackfill", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("初回 enqueue は dedupe_key 予約 + producer.send 呼出", async () => {
    await seedDiff(env, "d_e1");
    const sent: unknown[] = [];
    const producer = {
      async send(m: unknown): Promise<void> {
        sent.push(m);
      },
    };
    const r = await enqueueBackfill(env.ctx, producer, {
      diffId: "d_e1",
      questionId: "q1",
      newStableKey: "k1",
    });
    expect(r.alreadyEnqueued).toBe(false);
    expect(r.sent).toBe(true);
    expect(sent).toHaveLength(1);
    expect(r.dedupeKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("同一 (diffId, questionId, newStableKey) の重複 enqueue は alreadyEnqueued=true でスキップ", async () => {
    await seedDiff(env, "d_e2");
    const sent: unknown[] = [];
    const producer = {
      async send(m: unknown): Promise<void> {
        sent.push(m);
      },
    };
    await enqueueBackfill(env.ctx, producer, {
      diffId: "d_e2",
      questionId: "q1",
      newStableKey: "k1",
    });
    const second = await enqueueBackfill(env.ctx, producer, {
      diffId: "d_e2",
      questionId: "q1",
      newStableKey: "k1",
    });
    expect(second.alreadyEnqueued).toBe(true);
    expect(second.sent).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it("producer なし（local dev / Free plan）は dedupe_key を予約せず sent=false", async () => {
    await seedDiff(env, "d_e3");
    const r = await enqueueBackfill(env.ctx, null, {
      diffId: "d_e3",
      questionId: "q1",
      newStableKey: "k1",
    });
    expect(r.sent).toBe(false);
    expect(r.alreadyEnqueued).toBe(false);
    const row = await findById(env.ctx, "d_e3");
    expect(row?.dedupeKey).toBeNull();
  });

  it("producer.send 失敗時は dedupe_key を解放して throw", async () => {
    await seedDiff(env, "d_e4");
    const producer = {
      async send(): Promise<void> {
        throw new Error("queue unavailable");
      },
    };
    await expect(
      enqueueBackfill(env.ctx, producer, {
        diffId: "d_e4",
        questionId: "q1",
        newStableKey: "k1",
      }),
    ).rejects.toThrow("queue unavailable");
    const row = await findById(env.ctx, "d_e4");
    expect(row?.dedupeKey).toBeNull();
  });
});
