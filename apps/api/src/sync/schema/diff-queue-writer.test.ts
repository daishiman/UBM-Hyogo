// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { diffQueueWriter } from "./diff-queue-writer";

describe("diffQueueWriter", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("AC-2: 新規 question を 1 件 = 1 row で投入する", async () => {
    const r = await diffQueueWriter.enqueue(env.ctx, {
      revisionId: "rev-1",
      questionId: "qX",
      label: "新項目",
      diffKind: "added",
    });
    expect(r.enqueued).toBe(true);
    const row = await env.db
      .prepare("SELECT COUNT(*) AS c FROM schema_diff_queue WHERE question_id = ?")
      .bind("qX")
      .first<{ c: number }>();
    expect(row?.c).toBe(1);
  });

  it("AC-2 / AC-3: 同 questionId で queued が既にあれば INSERT をスキップする", async () => {
    await diffQueueWriter.enqueue(env.ctx, {
      revisionId: "rev-1",
      questionId: "qX",
      label: "新項目",
      diffKind: "added",
    });
    const r2 = await diffQueueWriter.enqueue(env.ctx, {
      revisionId: "rev-2",
      questionId: "qX",
      label: "同じ",
      diffKind: "added",
    });
    expect(r2.enqueued).toBe(false);
    const row = await env.db
      .prepare("SELECT COUNT(*) AS c FROM schema_diff_queue WHERE question_id = ?")
      .bind("qX")
      .first<{ c: number }>();
    expect(row?.c).toBe(1);
  });
});
