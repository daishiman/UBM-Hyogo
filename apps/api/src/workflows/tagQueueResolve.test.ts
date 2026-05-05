// @vitest-environment node
// 07a: tagQueueResolve workflow の unit / state / audit テスト
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import { tagQueueResolve, TagQueueResolveError } from "./tagQueueResolve";
import { adminEmail, asAdminId } from "../repository/_shared/brand";

const seed = async (env: InMemoryD1, status = "queued") => {
  await env.db
    .prepare(
      "INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('tag_1','tag-1','Tag 1','interest'),('tag_2','tag-2','Tag 2','interest')",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('q1','m1','r1', ?, '[]')",
    )
    .bind(status)
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at) VALUES ('m1','agreed','agreed','published',0,'system',?)",
    )
    .bind(new Date().toISOString())
    .run();
};

const baseInput = {
  queueId: "q1",
  actorUserId: asAdminId("admin_1"),
  actorEmail: adminEmail("admin@example.com"),
};

describe("tagQueueResolve", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("T1 confirmed: member_tags +N + queue.status='resolved' + audit", async () => {
    const r = await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1", "tag-2"],
    });
    expect(r.status).toBe("resolved");
    expect(r.idempotent).toBe(false);

    const tags = await env.db
      .prepare("SELECT tag_id FROM member_tags WHERE member_id = 'm1'")
      .all<{ tag_id: string }>();
    expect(tags.results.map((t) => t.tag_id).sort()).toEqual(["tag_1", "tag_2"]);

    const audits = await env.db
      .prepare("SELECT action FROM audit_log WHERE target_id = 'q1'")
      .all<{ action: string }>();
    expect(audits.results.length).toBe(1);
    expect(audits.results[0]!.action).toBe("admin.tag.queue_resolved");
  });

  it("T2 rejected: queue.reason 記録 + audit (queue_rejected)", async () => {
    const r = await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "rejected",
      reason: "spam",
    });
    expect(r.status).toBe("rejected");
    const row = await env.db
      .prepare("SELECT status, reason FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ status: string; reason: string }>();
    expect(row?.reason).toBe("spam");
    const audit = await env.db
      .prepare("SELECT action FROM audit_log WHERE target_id = 'q1'")
      .first<{ action: string }>();
    expect(audit?.action).toBe("admin.tag.queue_rejected");
  });

  it("reviewing から confirmed へ resolve できる（02b 互換）", async () => {
    await env.db
      .prepare("UPDATE tag_assignment_queue SET status = 'reviewing' WHERE queue_id = 'q1'")
      .run();
    const r = await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    expect(r.status).toBe("resolved");
  });

  it("T4 idempotent confirmed: 同一 tagCodes 再呼び出しで audit 件数不変", async () => {
    await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    const r2 = await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    expect(r2.idempotent).toBe(true);
    const audits = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'q1'")
      .first<{ n: number }>();
    expect(audits?.n).toBe(1);
  });

  it("T5 idempotent rejected: 同一 reason で audit 不変", async () => {
    await tagQueueResolve(env.ctx, { ...baseInput, action: "rejected", reason: "dup" });
    const r2 = await tagQueueResolve(env.ctx, { ...baseInput, action: "rejected", reason: "dup" });
    expect(r2.idempotent).toBe(true);
    const audits = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'q1'")
      .first<{ n: number }>();
    expect(audits?.n).toBe(1);
  });

  it("T4-2 idempotent payload mismatch: 別 tagCodes で再呼び出しは 409 (state_conflict)", async () => {
    await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    await expect(
      tagQueueResolve(env.ctx, { ...baseInput, action: "confirmed", tagCodes: ["tag-2"] }),
    ).rejects.toMatchObject({ code: "idempotent_payload_mismatch" });
  });

  it("T6 unidirectional: confirmed → rejected は state_conflict", async () => {
    await tagQueueResolve(env.ctx, {
      ...baseInput,
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    await expect(
      tagQueueResolve(env.ctx, { ...baseInput, action: "rejected", reason: "no" }),
    ).rejects.toMatchObject({ code: "state_conflict" });
  });

  it("T7 unidirectional: rejected → confirmed は state_conflict", async () => {
    await tagQueueResolve(env.ctx, { ...baseInput, action: "rejected", reason: "no" });
    await expect(
      tagQueueResolve(env.ctx, { ...baseInput, action: "confirmed", tagCodes: ["tag-1"] }),
    ).rejects.toMatchObject({ code: "state_conflict" });
  });

  it("T9 unknown tag code: unknown_tag_code (422)", async () => {
    await expect(
      tagQueueResolve(env.ctx, {
        ...baseInput,
        action: "confirmed",
        tagCodes: ["nonexistent"],
      }),
    ).rejects.toMatchObject({ code: "unknown_tag_code" });
  });

  it("T10 deleted member: member_deleted (422)", async () => {
    await env.db
      .prepare("UPDATE member_status SET is_deleted = 1 WHERE member_id = 'm1'")
      .run();
    await expect(
      tagQueueResolve(env.ctx, { ...baseInput, action: "confirmed", tagCodes: ["tag-1"] }),
    ).rejects.toMatchObject({ code: "member_deleted" });
  });

  it("queue 不在: queue_not_found", async () => {
    await expect(
      tagQueueResolve(env.ctx, {
        ...baseInput,
        queueId: "nope",
        action: "confirmed",
        tagCodes: ["tag-1"],
      }),
    ).rejects.toMatchObject({ code: "queue_not_found" });
  });

  it("TagQueueResolveError は code を持つ", () => {
    const e = new TagQueueResolveError("queue_not_found", "x");
    expect(e.code).toBe("queue_not_found");
    expect(e.name).toBe("TagQueueResolveError");
  });
});
