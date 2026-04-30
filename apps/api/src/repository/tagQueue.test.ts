import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { enqueue, findQueueById, isAllowedTransition, listQueue, transitionStatus } from "./tagQueue";
import { asMemberId, asResponseId } from "./_shared/brand";

const seed = (status: "queued" | "reviewing" | "resolved" = "queued") => ({
  tables: {
    tag_assignment_queue: [
      {
        queue_id: "q1",
        member_id: "m1",
        response_id: "r1",
        status,
        suggested_tags_json: "[]",
        reason: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
  },
  primaryKeys: { tag_assignment_queue: ["queue_id"] },
});

describe("tagQueue: 状態遷移", () => {
  it("isAllowedTransition: 許可される遷移 (AC-4 / 07a)", () => {
    // 02b 既存遷移
    expect(isAllowedTransition("queued", "reviewing")).toBe(true);
    expect(isAllowedTransition("reviewing", "resolved")).toBe(true);
    // 07a で追加（queued から直接 resolve / reject）
    expect(isAllowedTransition("queued", "resolved")).toBe(true);
    expect(isAllowedTransition("queued", "rejected")).toBe(true);
    expect(isAllowedTransition("reviewing", "rejected")).toBe(true);
  });

  it("isAllowedTransition: 不正遷移は false (終端からの逆走禁止)", () => {
    expect(isAllowedTransition("reviewing", "queued")).toBe(false);
    expect(isAllowedTransition("resolved", "reviewing")).toBe(false);
    expect(isAllowedTransition("resolved", "queued")).toBe(false);
    expect(isAllowedTransition("resolved", "rejected")).toBe(false);
    expect(isAllowedTransition("rejected", "resolved")).toBe(false);
    expect(isAllowedTransition("rejected", "queued")).toBe(false);
    expect(isAllowedTransition("queued", "queued")).toBe(false);
  });

  it("transitionStatus: queued → reviewing 成功", async () => {
    const fake = createFakeD1(seed("queued"));
    const r = await transitionStatus({ db: fake.d1 }, "q1", "reviewing");
    expect(r.status).toBe("reviewing");
  });

  it("transitionStatus: reviewing → resolved 成功", async () => {
    const fake = createFakeD1(seed("reviewing"));
    const r = await transitionStatus({ db: fake.d1 }, "q1", "resolved");
    expect(r.status).toBe("resolved");
  });

  it("transitionStatus: resolved → reviewing は throw (unidirectional)", async () => {
    const fake = createFakeD1(seed("resolved"));
    await expect(transitionStatus({ db: fake.d1 }, "q1", "reviewing")).rejects.toThrow(/invalid transition/);
  });

  it("transitionStatus: queued → resolved (07a 直接遷移) 成功", async () => {
    const fake = createFakeD1(seed("queued"));
    const r = await transitionStatus({ db: fake.d1 }, "q1", "resolved");
    expect(r.status).toBe("resolved");
  });
});

describe("tagQueue: CRUD", () => {
  it("enqueue は新規 queued 行を作成", async () => {
    const fake = createFakeD1({
      tables: { tag_assignment_queue: [] },
      primaryKeys: { tag_assignment_queue: ["queue_id"] },
    });
    const r = await enqueue(
      { db: fake.d1 },
      { queueId: "q9", memberId: asMemberId("m1"), responseId: asResponseId("r1"), suggestedTagsJson: "[]", reason: null },
    );
    expect(r.queueId).toBe("q9");
  });

  it("listQueue(status) は status filter + created_at ASC", async () => {
    const fake = createFakeD1(seed("queued"));
    const r = await listQueue({ db: fake.d1 }, "queued");
    expect(r).toHaveLength(1);
    expect(r[0]!.status).toBe("queued");
  });

  it("findQueueById", async () => {
    const fake = createFakeD1(seed("queued"));
    const r = await findQueueById({ db: fake.d1 }, "q1");
    expect(r?.queueId).toBe("q1");
  });
});
