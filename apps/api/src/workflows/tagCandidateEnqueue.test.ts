// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import { enqueueTagCandidate, parsePaused } from "./tagCandidateEnqueue";

describe("enqueueTagCandidate (07a candidate auto-enqueue hook)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-8: member_tags 空 + 未解決 queue 無し → enqueued=true", async () => {
    const r = await enqueueTagCandidate(env.ctx, {
      memberId: "m1",
      responseId: "r1",
    });
    expect(r.enqueued).toBe(true);
    expect(r.queueId).toBeDefined();
    const row = await env.db
      .prepare("SELECT status, idempotency_key FROM tag_assignment_queue WHERE member_id = 'm1'")
      .first<{ status: string; idempotency_key: string }>();
    expect(row?.status).toBe("queued");
    expect(row?.idempotency_key).toBe("m1:r1");
  });

  it("member_tags が既にある場合は skip (has_tags)", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('t1','c1','L','cat')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1','t1','rule','system')",
      )
      .run();
    const r = await enqueueTagCandidate(env.ctx, {
      memberId: "m1",
      responseId: "r1",
    });
    expect(r.enqueued).toBe(false);
    expect(r.reason).toBe("has_tags");
  });

  it("未解決 queue (queued) がある場合は skip (has_pending_candidate)", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('q_existing','m1','r0','queued','[]')",
      )
      .run();
    const r = await enqueueTagCandidate(env.ctx, {
      memberId: "m1",
      responseId: "r1",
    });
    expect(r.enqueued).toBe(false);
    expect(r.reason).toBe("has_pending_candidate");
  });

  it("既存 queue が resolved/rejected のみなら新規 enqueue 可", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('q_old','m1','r0','rejected','[]')",
      )
      .run();
    const r = await enqueueTagCandidate(env.ctx, {
      memberId: "m1",
      responseId: "r1",
    });
    expect(r.enqueued).toBe(true);
  });

  it("同じ memberId/responseId は idempotency key で既存 queueId を返す", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json, idempotency_key) VALUES ('q_old','m1','r1','rejected','[]','m1:r1')",
      )
      .run();
    const r = await enqueueTagCandidate(env.ctx, {
      memberId: "m1",
      responseId: "r1",
    });
    expect(r.enqueued).toBe(true);
    expect(r.queueId).toBe("q_old");
    const count = await env.db
      .prepare("SELECT COUNT(*) AS n FROM tag_assignment_queue WHERE member_id = 'm1'")
      .first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it("TAG_QUEUE_PAUSED 未設定で enqueue される", async () => {
    const r = await enqueueTagCandidate(
      env.ctx,
      {
        memberId: "m1",
        responseId: "r1",
      },
      parsePaused({}),
    );
    expect(r.enqueued).toBe(true);
  });

  it('TAG_QUEUE_PAUSED="false" で enqueue される', async () => {
    const r = await enqueueTagCandidate(
      env.ctx,
      {
        memberId: "m1",
        responseId: "r1",
      },
      parsePaused({ TAG_QUEUE_PAUSED: "false" }),
    );
    expect(r.enqueued).toBe(true);
  });

  it('TAG_QUEUE_PAUSED="true" で D1 に触らず paused reason と structured log を返す', async () => {
    const prepareSpy = vi.spyOn(env.db, "prepare");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const r = await enqueueTagCandidate(
      env.ctx,
      {
        memberId: "m1",
        responseId: "r1",
      },
      parsePaused({ TAG_QUEUE_PAUSED: "true" }),
    );

    expect(r).toEqual({ enqueued: false, reason: "paused" });
    expect(prepareSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('"code":"UBM-TAGQ-PAUSED"'),
    );
    expect(warnSpy.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('"reason":"paused"'),
    );
  });
});

describe("parsePaused", () => {
  it.each([
    [{}, false],
    [{ TAG_QUEUE_PAUSED: "false" }, false],
    [{ TAG_QUEUE_PAUSED: "true" }, true],
    [{ TAG_QUEUE_PAUSED: "True" }, false],
    [{ TAG_QUEUE_PAUSED: "1" }, false],
  ] as const)("parses %j as %s", (env, expected) => {
    expect(parsePaused(env)).toBe(expected);
  });
});
