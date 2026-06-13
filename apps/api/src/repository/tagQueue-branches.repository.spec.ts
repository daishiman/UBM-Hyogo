// @vitest-environment node
// Branch coverage recovery for tagQueue repository.
// Targets uncovered branches:
//  - listQueue `?? []` fallback (L106/L109)
//  - createIdempotent race-lost catch path (L198)
//  - listPending/listDlq `?? []` fallback + listDlq limit cond (L219/L235/L236)
//  - incrementRetryWithDlqAudit noop + dlq-with-batch + dlq-without-batch (L284/L295)
//  - moveToDlqWithAudit noop + with-batch + without-batch (L310/L316)
//  - resolveConfirmed / resolveRejected meta.changes fallback + changed true/false (L335/L350)
import { describe, it, expect, beforeEach } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import type { DbCtx } from "./_shared/db";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import {
  createIdempotent,
  incrementRetryWithDlqAudit,
  listDlq,
  listPending,
  listQueue,
  moveToDlqWithAudit,
  resolveConfirmed,
  resolveRejected,
  TAG_QUEUE_MAX_RETRY,
} from "./tagQueue";
import { asMemberId, asResponseId } from "./_shared/brand";

const seedQueued = (
  overrides: Partial<{
    queueId: string;
    status: string;
    attemptCount: number;
    idempotencyKey: string | null;
  }> = {},
) => {
  const o = {
    queueId: "q1",
    status: "queued",
    attemptCount: 0,
    idempotencyKey: null as string | null,
    ...overrides,
  };
  return {
    tables: {
      tag_assignment_queue: [
        {
          queue_id: o.queueId,
          member_id: "m1",
          response_id: "r1",
          status: o.status,
          suggested_tags_json: "[]",
          reason: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          idempotency_key: o.idempotencyKey,
          attempt_count: o.attemptCount,
          last_error: null,
          next_visible_at: null,
          dlq_at: null,
        },
      ] as Record<string, unknown>[],
    },
    primaryKeys: { tag_assignment_queue: ["queue_id"] },
    audit_log: [],
  };
};

// Stub ctx whose `.all()` returns a missing `results` field -> `?? []` fallback.
const stubNoResultsCtx = (): DbCtx => ({
  db: {
    prepare: () => {
      const stmt = {
        bind: () => stmt,
        first: async () => null,
        all: async () => ({}) as { results: never[] },
        run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
      };
      return stmt;
    },
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as DbCtx["db"],
});

// ctx that drops batch -> exercises the sequential else-branch in *WithAudit.
const withoutBatchCtx = (env: InMemoryD1): DbCtx => {
  const dbNoBatch = Object.create(env.ctx.db) as typeof env.ctx.db;
  Object.defineProperty(dbNoBatch, "batch", { value: undefined });
  return { ...env.ctx, db: dbNoBatch };
};

describe("tagQueue branch recovery", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  describe("listQueue / listPending / listDlq `?? []` fallbacks", () => {
    it("listQueue (with status and without) returns [] when results missing", async () => {
      expect(await listQueue(stubNoResultsCtx(), "queued")).toEqual([]);
      expect(await listQueue(stubNoResultsCtx())).toEqual([]);
    });

    it("listPending returns [] when results missing", async () => {
      expect(await listPending(stubNoResultsCtx(), { now: "2026-01-01T00:00:00.000Z" })).toEqual([]);
    });

    it("listDlq returns [] when results missing, and applies numeric limit slice", async () => {
      expect(await listDlq(stubNoResultsCtx())).toEqual([]);

      // limit cond#0 (number path): seed 2 dlq rows, request limit 1.
      const fake = createFakeD1({
        tables: {
          tag_assignment_queue: [
            {
              queue_id: "d1",
              member_id: "m1",
              response_id: "r1",
              status: "dlq",
              suggested_tags_json: "[]",
              reason: null,
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
              idempotency_key: null,
              attempt_count: 4,
              last_error: "x",
              next_visible_at: null,
              dlq_at: "2026-01-01T00:00:00.000Z",
            },
            {
              queue_id: "d2",
              member_id: "m2",
              response_id: "r2",
              status: "dlq",
              suggested_tags_json: "[]",
              reason: null,
              created_at: "2026-01-02T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
              idempotency_key: null,
              attempt_count: 4,
              last_error: "y",
              next_visible_at: null,
              dlq_at: "2026-01-02T00:00:00.000Z",
            },
          ] as Record<string, unknown>[],
        },
        primaryKeys: { tag_assignment_queue: ["queue_id"] },
      });
      const limited = await listDlq({ db: fake.d1 }, { limit: 1 });
      expect(limited).toHaveLength(1);
    });
  });

  describe("createIdempotent race-lost catch", () => {
    it("returns existing row when INSERT throws but a row appears (L198 true)", async () => {
      // First call returns null (findByIdempotencyKey), INSERT throws UNIQUE,
      // then the post-catch findByIdempotencyKey resolves to a row.
      let findCalls = 0;
      const preparedRow = {
        queue_id: "q-existing",
        member_id: "m1",
        response_id: "r1",
        status: "queued",
        suggested_tags_json: "[]",
        reason: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        idempotency_key: "m1:r1",
        attempt_count: 0,
        last_error: null,
        next_visible_at: null,
        dlq_at: null,
      };
      const ctx: DbCtx = {
        db: {
          prepare: (sql: string) => {
            const isSelect = /^\s*SELECT/i.test(sql);
            const stmt = {
              bind: () => stmt,
              first: async () => {
                if (!isSelect) return null;
                findCalls += 1;
                // 1st find -> null (no existing); 2nd find (after catch) -> existing row.
                return findCalls >= 2 ? preparedRow : null;
              },
              all: async () => ({ results: [] as never[] }),
              run: async () => {
                throw new Error("D1_ERROR: UNIQUE constraint failed");
              },
            };
            return stmt;
          },
          exec: async () => ({ count: 0, duration: 0 }),
        } as unknown as DbCtx["db"],
      };
      const r = await createIdempotent(ctx, {
        queueId: "q-new",
        memberId: asMemberId("m1"),
        responseId: asResponseId("r1"),
        suggestedTagsJson: "[]",
        reason: null,
        idempotencyKey: "m1:r1",
      });
      expect(r.isExisting).toBe(true);
      expect(r.row.queueId).toBe("q-existing");
    });

    it("rethrows when INSERT fails and no row appears (L198 false)", async () => {
      const ctx: DbCtx = {
        db: {
          prepare: () => {
            const stmt = {
              bind: () => stmt,
              first: async () => null, // never finds a row
              all: async () => ({ results: [] as never[] }),
              run: async () => {
                throw new Error("D1_ERROR: disk full");
              },
            };
            return stmt;
          },
          exec: async () => ({ count: 0, duration: 0 }),
        } as unknown as DbCtx["db"],
      };
      await expect(
        createIdempotent(ctx, {
          queueId: "q-new",
          memberId: asMemberId("m1"),
          responseId: asResponseId("r1"),
          suggestedTagsJson: "[]",
          reason: null,
          idempotencyKey: "m1:r1",
        }),
      ).rejects.toThrow(/disk full/);
    });
  });

  describe("incrementRetryWithDlqAudit", () => {
    it("noop when row is not queued (L284)", async () => {
      const fake = createFakeD1(seedQueued({ status: "resolved" }));
      const r = await incrementRetryWithDlqAudit({ db: fake.d1 }, "q1", "err", "2026-01-01T00:00:00.000Z");
      expect(r.moved).toBe("noop");
    });

    it("retry path returns retry (below max)", async () => {
      const fake = createFakeD1(seedQueued({ attemptCount: 0 }));
      const r = await incrementRetryWithDlqAudit({ db: fake.d1 }, "q1", "err", "2026-01-01T00:00:00.000Z");
      expect(r.moved).toBe("retry");
    });

    it("dlq path writes audit via batch when available", async () => {
      // seed a queued row at max attempts so next increment -> dlq.
      await env.db.exec(
        `INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json, attempt_count) VALUES ('qb','m1','r1','queued','[]', ${TAG_QUEUE_MAX_RETRY})`,
      );
      const r = await incrementRetryWithDlqAudit(env.ctx, "qb", "boom", "2026-01-01T00:00:00.000Z");
      expect(r.moved).toBe("dlq");
      const audit = await env.db
        .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'admin.tag.queue_dlq_moved'")
        .first<{ n: number }>();
      expect(audit?.n).toBe(1);
      const row = await env.db
        .prepare("SELECT status FROM tag_assignment_queue WHERE queue_id = 'qb'")
        .first<{ status: string }>();
      expect(row?.status).toBe("dlq");
    });

    it("dlq path falls back to sequential run when batch unavailable (L295 else)", async () => {
      await env.db.exec(
        `INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json, attempt_count) VALUES ('qc','m1','r1','queued','[]', ${TAG_QUEUE_MAX_RETRY})`,
      );
      const r = await incrementRetryWithDlqAudit(withoutBatchCtx(env), "qc", "boom", "2026-01-01T00:00:00.000Z");
      expect(r.moved).toBe("dlq");
      const audit = await env.db
        .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'qc'")
        .first<{ n: number }>();
      expect(audit?.n).toBe(1);
    });
  });

  describe("moveToDlqWithAudit", () => {
    it("noop when row is not queued (L310)", async () => {
      const fake = createFakeD1(seedQueued({ status: "rejected" }));
      const r = await moveToDlqWithAudit({ db: fake.d1 }, "q1", "err", "2026-01-01T00:00:00.000Z");
      expect(r.changed).toBe(false);
    });

    it("moves to dlq with audit via batch", async () => {
      await env.db.exec(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('qd','m1','r1','queued','[]')",
      );
      const r = await moveToDlqWithAudit(env.ctx, "qd", "force", "2026-01-02T00:00:00.000Z");
      expect(r.changed).toBe(true);
      const row = await env.db
        .prepare("SELECT status FROM tag_assignment_queue WHERE queue_id = 'qd'")
        .first<{ status: string }>();
      expect(row?.status).toBe("dlq");
    });

    it("moves to dlq sequentially when batch unavailable (L316 else)", async () => {
      await env.db.exec(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('qe','m1','r1','queued','[]')",
      );
      const r = await moveToDlqWithAudit(withoutBatchCtx(env), "qe", "force", "2026-01-02T00:00:00.000Z");
      expect(r.changed).toBe(true);
      const audit = await env.db
        .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'qe'")
        .first<{ n: number }>();
      expect(audit?.n).toBe(1);
    });
  });

  describe("resolveConfirmed / resolveRejected changed flag", () => {
    it("resolveConfirmed: changed=true for a queued row, false for missing (L335)", async () => {
      await env.db.exec(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('qf','m1','r1','queued','[]')",
      );
      const ok = await resolveConfirmed(env.ctx, "qf", ["TAG_A"], "2026-01-03T00:00:00.000Z");
      expect(ok.changed).toBe(true);
      // missing / wrong-status row -> no change (changes = 0 -> `> 0` false)
      const miss = await resolveConfirmed(env.ctx, "ghost", ["TAG_A"], "2026-01-03T00:00:00.000Z");
      expect(miss.changed).toBe(false);
    });

    it("resolveRejected: changed=true for a reviewing row, false for resolved (L350)", async () => {
      await env.db.exec(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('qg','m1','r1','reviewing','[]')",
      );
      const ok = await resolveRejected(env.ctx, "qg", "not relevant", "2026-01-03T00:00:00.000Z");
      expect(ok.changed).toBe(true);
      await env.db.exec(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('qh','m1','r1','resolved','[]')",
      );
      const miss = await resolveRejected(env.ctx, "qh", "x", "2026-01-03T00:00:00.000Z");
      expect(miss.changed).toBe(false);
    });

    it("resolveConfirmed: meta.changes undefined coalesces to 0 (L335 branch#1)", async () => {
      // stub run() returns a meta object lacking `changes` -> `result.meta?.changes ?? 0`.
      const ctx: DbCtx = {
        db: {
          prepare: () => {
            const stmt = {
              bind: () => stmt,
              first: async () => null,
              all: async () => ({ results: [] as never[] }),
              run: async () => ({ success: true, meta: {} as { changes?: number } }),
            };
            return stmt;
          },
          exec: async () => ({ count: 0, duration: 0 }),
        } as unknown as DbCtx["db"],
      };
      const r = await resolveConfirmed(ctx, "q1", ["T"], "2026-01-03T00:00:00.000Z");
      expect(r.changed).toBe(false);
    });

    it("resolveRejected: meta.changes undefined coalesces to 0 (L350 branch#1)", async () => {
      const ctx: DbCtx = {
        db: {
          prepare: () => {
            const stmt = {
              bind: () => stmt,
              first: async () => null,
              all: async () => ({ results: [] as never[] }),
              run: async () => ({ success: true, meta: {} as { changes?: number } }),
            };
            return stmt;
          },
          exec: async () => ({ count: 0, duration: 0 }),
        } as unknown as DbCtx["db"],
      };
      const r = await resolveRejected(ctx, "q1", "x", "2026-01-03T00:00:00.000Z");
      expect(r.changed).toBe(false);
    });
  });
});
