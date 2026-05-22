// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import {
  NonRetryableTagQueueError,
  runTagQueueRetryTick,
} from "./tagQueueRetryTick";

const NOW = "2026-05-05T00:00:00.000Z";

async function seedQueue(
  db: D1Database,
  rows: Array<{
    queueId: string;
    attemptCount?: number;
    suggestedTagsJson?: string;
    reason?: string | null;
    lastError?: string | null;
    nextVisibleAt?: string | null;
  }>,
): Promise<void> {
  for (const row of rows) {
    await db
      .prepare(
        `INSERT INTO tag_assignment_queue
          (queue_id, member_id, response_id, status, suggested_tags_json, reason, attempt_count, last_error, next_visible_at, created_at, updated_at)
         VALUES (?1, 'm1', ?2, 'queued', ?3, ?4, ?5, ?6, ?7, ?8, ?8)`,
      )
      .bind(
        row.queueId,
        `r-${row.queueId}`,
        row.suggestedTagsJson ?? "[]",
        row.reason === undefined ? "retry_tick" : row.reason,
        row.attemptCount ?? 0,
        row.lastError === undefined ? "previous error" : row.lastError,
        row.nextVisibleAt ?? null,
        NOW,
      )
      .run();
  }
}

describe("runTagQueueRetryTick", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("retryable error increments attempt_count and next_visible_at", async () => {
    await seedQueue(env.db, [{ queueId: "q1", attemptCount: 0 }]);

    const result = await runTagQueueRetryTick({ DB: env.db }, {
      now: () => NOW,
      processRow: async () => {
        throw new Error("D1 transient");
      },
    });

    expect(result.retried).toBe(1);
    const row = await env.db
      .prepare("SELECT attempt_count, last_error, next_visible_at FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ attempt_count: number; last_error: string; next_visible_at: string }>();
    expect(row?.attempt_count).toBe(1);
    expect(row?.last_error).toBe("D1 transient");
    expect(row?.next_visible_at).toBe("2026-05-05T00:00:30.000Z");
  });

  it("default scheduled processor advances retry-eligible rows", async () => {
    await seedQueue(env.db, [{ queueId: "q1", attemptCount: 1, lastError: "previous transient" }]);

    const result = await runTagQueueRetryTick({ DB: env.db }, { now: () => NOW });

    expect(result.retried).toBe(1);
    const row = await env.db
      .prepare("SELECT attempt_count, last_error, next_visible_at FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ attempt_count: number; last_error: string; next_visible_at: string }>();
    expect(row?.attempt_count).toBe(2);
    expect(row?.last_error).toBe("previous transient");
    expect(row?.next_visible_at).toBe("2026-05-05T00:01:00.000Z");
  });

  it("max retry overflow moves to DLQ and writes one audit row atomically", async () => {
    await seedQueue(env.db, [{ queueId: "q1", attemptCount: 3 }]);

    const result = await runTagQueueRetryTick({ DB: env.db }, {
      now: () => NOW,
      processRow: async () => {
        throw new Error("still failing");
      },
    });

    expect(result.movedToDlq).toBe(1);
    const row = await env.db
      .prepare("SELECT status, attempt_count, dlq_at FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ status: string; attempt_count: number; dlq_at: string }>();
    expect(row).toMatchObject({ status: "dlq", attempt_count: 4, dlq_at: NOW });
    const audit = await env.db
      .prepare("SELECT action, target_type, target_id, actor_email FROM audit_log WHERE target_id = 'q1'")
      .first<{ action: string; target_type: string; target_id: string; actor_email: string }>();
    expect(audit).toMatchObject({
      action: "admin.tag.queue_dlq_moved",
      target_type: "tag_queue",
      target_id: "q1",
      actor_email: "system@retry-tick",
    });
  });

  it("batchSize limits scanned rows", async () => {
    await seedQueue(
      env.db,
      Array.from({ length: 30 }, (_, i) => ({ queueId: `q${i + 1}` })),
    );

    const result = await runTagQueueRetryTick({ DB: env.db }, {
      now: () => NOW,
      batchSize: 10,
      processRow: async () => {
        throw new Error("retry");
      },
    });

    expect(result.scanned).toBe(10);
    expect(result.retried).toBe(10);
  });

  it("maxRuntimeMs aborts and leaves remaining rows for the next tick", async () => {
    await seedQueue(
      env.db,
      Array.from({ length: 5 }, (_, i) => ({ queueId: `q${i + 1}` })),
    );
    let t = 0;

    const result = await runTagQueueRetryTick({ DB: env.db }, {
      now: () => NOW,
      maxRuntimeMs: 150,
      clockMs: () => {
        t += 100;
        return t;
      },
      processRow: async () => {
        throw new Error("retry");
      },
    });

    expect(result.abortedByTimeout).toBe(true);
    expect(result.scanned).toBe(1);
  });

  it("NonRetryableTagQueueError moves directly to DLQ and writes audit", async () => {
    await seedQueue(env.db, [{ queueId: "q1", attemptCount: 0 }]);

    const result = await runTagQueueRetryTick({ DB: env.db }, {
      now: () => NOW,
      processRow: async () => {
        throw new NonRetryableTagQueueError("validation");
      },
    });

    expect(result.movedToDlq).toBe(1);
    const row = await env.db
      .prepare("SELECT status, attempt_count FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ status: string; attempt_count: number }>();
    expect(row).toMatchObject({ status: "dlq", attempt_count: 0 });
    const count = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'admin.tag.queue_dlq_moved'")
      .first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it("plain human-review queued rows are skipped by default", async () => {
    await seedQueue(env.db, [{
      queueId: "q1",
      reason: null,
      lastError: null,
      nextVisibleAt: null,
    }]);

    const result = await runTagQueueRetryTick({ DB: env.db }, { now: () => NOW });

    expect(result.skipped).toBe(1);
    const row = await env.db
      .prepare("SELECT status, attempt_count FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ status: string; attempt_count: number }>();
    expect(row).toMatchObject({ status: "queued", attempt_count: 0 });
  });
});
