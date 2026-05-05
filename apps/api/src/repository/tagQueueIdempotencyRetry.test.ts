// ut-02a-tag-assignment-queue-management:
//   tag_assignment_queue の idempotency / retry / DLQ 拡張の unit test。
//   AC-3 (idempotency), AC-4 (retry/DLQ), AC-1 (listPending/listDlq) をカバーする。
import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import {
  createIdempotent,
  deriveIdempotencyKey,
  findByIdempotencyKey,
  incrementRetry,
  listDlq,
  listPending,
  moveToDlq,
  TAG_QUEUE_MAX_RETRY,
} from "./tagQueue";
import { asMemberId, asResponseId } from "./_shared/brand";

const emptyState = () => ({
  tables: { tag_assignment_queue: [] as Record<string, unknown>[] },
  primaryKeys: { tag_assignment_queue: ["queue_id"] },
});

const seedQueued = (
  overrides: Partial<{
    queueId: string;
    memberId: string;
    responseId: string;
    idempotencyKey: string | null;
    attemptCount: number;
    nextVisibleAt: string | null;
    status: string;
  }> = {},
) => {
  const o = {
    queueId: "q1",
    memberId: "m1",
    responseId: "r1",
    idempotencyKey: null as string | null,
    attemptCount: 0,
    nextVisibleAt: null as string | null,
    status: "queued",
    ...overrides,
  };
  return {
    tables: {
      tag_assignment_queue: [
        {
          queue_id: o.queueId,
          member_id: o.memberId,
          response_id: o.responseId,
          status: o.status,
          suggested_tags_json: "[]",
          reason: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          idempotency_key: o.idempotencyKey,
          attempt_count: o.attemptCount,
          last_error: null,
          next_visible_at: o.nextVisibleAt,
          dlq_at: null,
        },
      ] as Record<string, unknown>[],
    },
    primaryKeys: { tag_assignment_queue: ["queue_id"] },
  };
};

describe("tagQueue: idempotency (AC-3)", () => {
  it("createIdempotent: 新規 key で行を作成し isExisting=false", async () => {
    const fake = createFakeD1(emptyState());
    const r = await createIdempotent(
      { db: fake.d1 },
      {
        queueId: "q-new",
        memberId: asMemberId("m1"),
        responseId: asResponseId("r1"),
        suggestedTagsJson: "[]",
        reason: null,
        idempotencyKey: deriveIdempotencyKey({ memberId: "m1", responseId: "r1" }),
      },
    );
    expect(r.isExisting).toBe(false);
    expect(r.row.queueId).toBe("q-new");
    expect(r.row.idempotencyKey).toBe("m1:r1");
  });

  it("createIdempotent: 同一 key で 2 度目は isExisting=true・新規 INSERT なし", async () => {
    const fake = createFakeD1(seedQueued({ idempotencyKey: "m1:r1" }));
    const r = await createIdempotent(
      { db: fake.d1 },
      {
        queueId: "q-dup",
        memberId: asMemberId("m1"),
        responseId: asResponseId("r1"),
        suggestedTagsJson: "[]",
        reason: null,
        idempotencyKey: "m1:r1",
      },
    );
    expect(r.isExisting).toBe(true);
    expect(r.row.queueId).toBe("q1"); // 既存行の id
    // INSERT は試みていないことを確認（fake state の行数で判定）
    expect(fake.state.tables.tag_assignment_queue!.length).toBe(1);
  });

  it("findByIdempotencyKey: 該当行を返す", async () => {
    const fake = createFakeD1(seedQueued({ idempotencyKey: "m1:r1" }));
    const r = await findByIdempotencyKey({ db: fake.d1 }, "m1:r1");
    expect(r?.queueId).toBe("q1");
  });

  it("findByIdempotencyKey: 該当無しは null", async () => {
    const fake = createFakeD1(emptyState());
    const r = await findByIdempotencyKey({ db: fake.d1 }, "ghost");
    expect(r).toBeNull();
  });

  it("deriveIdempotencyKey: deterministic", () => {
    expect(deriveIdempotencyKey({ memberId: "m1", responseId: "r1" })).toBe("m1:r1");
    expect(deriveIdempotencyKey({ memberId: "m1", responseId: "r2" })).toBe("m1:r2");
  });
});

describe("tagQueue: retry / DLQ (AC-4)", () => {
  it("incrementRetry: attempt < N で next_visible_at が指数バックオフ", async () => {
    const fake = createFakeD1(seedQueued({ attemptCount: 0 }));
    const r = await incrementRetry(
      { db: fake.d1 },
      "q1",
      "transient error",
      "2026-01-01T00:00:00.000Z",
    );
    expect(r.moved).toBe("retry");
    const row = fake.state.tables.tag_assignment_queue![0]!;
    expect(row.attempt_count).toBe(1);
    expect(row.last_error).toBe("transient error");
    // base 30s * 2^0 = 30s 後
    expect(row.next_visible_at).toBe("2026-01-01T00:00:30.000Z");
  });

  it("incrementRetry: 2 回目はバックオフ 60s（base * 2^1）", async () => {
    const fake = createFakeD1(seedQueued({ attemptCount: 1 }));
    await incrementRetry({ db: fake.d1 }, "q1", "err2", "2026-01-01T00:00:00.000Z");
    const row = fake.state.tables.tag_assignment_queue![0]!;
    expect(row.attempt_count).toBe(2);
    expect(row.next_visible_at).toBe("2026-01-01T00:01:00.000Z");
  });

  it("incrementRetry: 上限超過で DLQ へ移送", async () => {
    // attemptCount = MAX_RETRY (3) の状態で incrementRetry → next=4 > MAX → dlq
    const fake = createFakeD1(seedQueued({ attemptCount: TAG_QUEUE_MAX_RETRY }));
    const r = await incrementRetry(
      { db: fake.d1 },
      "q1",
      "final error",
      "2026-01-01T00:00:00.000Z",
    );
    expect(r.moved).toBe("dlq");
    const row = fake.state.tables.tag_assignment_queue![0]!;
    expect(row.status).toBe("dlq");
    expect(row.dlq_at).toBe("2026-01-01T00:00:00.000Z");
    expect(row.last_error).toBe("final error");
  });

  it("incrementRetry: terminal 行（resolved / rejected / dlq）には触らない（fail-closed）", async () => {
    for (const status of ["resolved", "rejected", "dlq"] as const) {
      const fake = createFakeD1(seedQueued({ status }));
      const r = await incrementRetry(
        { db: fake.d1 },
        "q1",
        "err",
        "2026-01-01T00:00:00.000Z",
      );
      expect(r.moved).toBe("noop");
      const row = fake.state.tables.tag_assignment_queue![0]!;
      // 元状態維持
      expect(row.status).toBe(status);
      expect(row.attempt_count).toBe(0);
    }
  });

  it("moveToDlq: queued のみ DLQ 化（changed=true）", async () => {
    const fake = createFakeD1(seedQueued());
    const r = await moveToDlq(
      { db: fake.d1 },
      "q1",
      "force dlq",
      "2026-01-02T00:00:00.000Z",
    );
    expect(r.changed).toBe(true);
    const row = fake.state.tables.tag_assignment_queue![0]!;
    expect(row.status).toBe("dlq");
    expect(row.dlq_at).toBe("2026-01-02T00:00:00.000Z");
    expect(row.last_error).toBe("force dlq");
  });

  it("moveToDlq: terminal 行は changed=false（fail-closed）", async () => {
    const fake = createFakeD1(seedQueued({ status: "resolved" }));
    const r = await moveToDlq({ db: fake.d1 }, "q1", "err", "2026-01-02T00:00:00.000Z");
    expect(r.changed).toBe(false);
    const row = fake.state.tables.tag_assignment_queue![0]!;
    expect(row.status).toBe("resolved");
  });
});

describe("tagQueue: listPending / listDlq (AC-1)", () => {
  it("listPending: status='queued' かつ next_visible_at が now 以下のみ返す", async () => {
    const now = "2026-01-01T00:01:00.000Z";
    const fake = createFakeD1({
      tables: {
        tag_assignment_queue: [
          // visible（next_visible_at が now 以前）
          {
            queue_id: "q-visible",
            member_id: "m1",
            response_id: "r1",
            status: "queued",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
            idempotency_key: null,
            attempt_count: 0,
            last_error: null,
            next_visible_at: "2026-01-01T00:00:30.000Z",
            dlq_at: null,
          },
          // future（next_visible_at が now より未来）→ filter で除外
          {
            queue_id: "q-future",
            member_id: "m2",
            response_id: "r2",
            status: "queued",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:01.000Z",
            updated_at: "2026-01-01T00:00:01.000Z",
            idempotency_key: null,
            attempt_count: 1,
            last_error: "boom",
            next_visible_at: "2026-01-01T00:10:00.000Z",
            dlq_at: null,
          },
          // null（バックオフ未設定）→ 即可視
          {
            queue_id: "q-null",
            member_id: "m3",
            response_id: "r3",
            status: "queued",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:02.000Z",
            updated_at: "2026-01-01T00:00:02.000Z",
            idempotency_key: null,
            attempt_count: 0,
            last_error: null,
            next_visible_at: null,
            dlq_at: null,
          },
          // dlq → 除外
          {
            queue_id: "q-dlq",
            member_id: "m4",
            response_id: "r4",
            status: "dlq",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:03.000Z",
            updated_at: "2026-01-01T00:00:03.000Z",
            idempotency_key: null,
            attempt_count: 4,
            last_error: "final",
            next_visible_at: null,
            dlq_at: "2026-01-01T00:00:03.000Z",
          },
        ] as Record<string, unknown>[],
      },
      primaryKeys: { tag_assignment_queue: ["queue_id"] },
    });
    const rows = await listPending({ db: fake.d1 }, { now });
    const ids = rows.map((r) => r.queueId).sort();
    expect(ids).toEqual(["q-null", "q-visible"]);
  });

  it("listDlq: status='dlq' のみ返す", async () => {
    const fake = createFakeD1({
      tables: {
        tag_assignment_queue: [
          {
            queue_id: "q-dlq",
            member_id: "m1",
            response_id: "r1",
            status: "dlq",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
            idempotency_key: null,
            attempt_count: 4,
            last_error: "final",
            next_visible_at: null,
            dlq_at: "2026-01-01T00:00:00.000Z",
          },
          {
            queue_id: "q-q",
            member_id: "m2",
            response_id: "r2",
            status: "queued",
            suggested_tags_json: "[]",
            reason: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
            idempotency_key: null,
            attempt_count: 0,
            last_error: null,
            next_visible_at: null,
            dlq_at: null,
          },
        ] as Record<string, unknown>[],
      },
      primaryKeys: { tag_assignment_queue: ["queue_id"] },
    });
    const rows = await listDlq({ db: fake.d1 });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.queueId).toBe("q-dlq");
    expect(rows[0]!.dlqAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
