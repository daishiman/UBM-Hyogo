// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsQueueRoute } from "./tags-queue";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedQueue = async (env: InMemoryD1, status: string = "queued") => {
  await env.db
    .prepare(
      "INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('tag_1','tag-1','Tag 1','interest')",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES (?, 'm1','r1', ?, '[]')",
    )
    .bind("q1", status)
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at) VALUES ('m1','agreed','agreed','published',0,'system',?)",
    )
    .bind(new Date().toISOString())
    .run();
};

const postResolve = async (env: InMemoryD1, body: unknown, queueId = "q1") => {
  const app = createAdminTagsQueueRoute();
  return app.request(
    `/tags/queue/${queueId}/resolve`,
    {
      method: "POST",
      headers: {
        ...(await adminAuthHeader()),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    makeEnv(env),
  );
};

describe("admin tags queue", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedQueue(env);
  }, 30000);

  it("authz: session なしは 401", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request("/tags/queue", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("GET /tags/queue: 200 + items", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request(
      "/tags/queue",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number };
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it("AC-1: confirmed → member_tags 反映 + queue.status='resolved'", async () => {
    const res = await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { status: string; tagCodes: string[] } };
    expect(body.result.status).toBe("resolved");
    expect(body.result.tagCodes).toEqual(["tag-1"]);

    const tag = await env.db
      .prepare("SELECT tag_id FROM member_tags WHERE member_id = 'm1' AND tag_id = 'tag_1'")
      .first<{ tag_id: string }>();
    expect(tag?.tag_id).toBe("tag_1");
  });

  it("AC-2: rejected → reason 記録", async () => {
    const res = await postResolve(env, { action: "rejected", reason: "duplicate" });
    expect(res.status).toBe(200);
    const row = await env.db
      .prepare("SELECT status, reason FROM tag_assignment_queue WHERE queue_id = 'q1'")
      .first<{ status: string; reason: string }>();
    expect(row?.status).toBe("rejected");
    expect(row?.reason).toBe("duplicate");
  });

  it("AC-2: 空 reason は zod で 400", async () => {
    const res = await postResolve(env, { action: "rejected", reason: "" });
    expect(res.status).toBe(400);
  });

  it("AC-3: 同じ confirmed action は idempotent (200, audit 件数不変)", async () => {
    await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    const before = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'q1'")
      .first<{ n: number }>();
    const res = await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    expect(res.status).toBe(200);
    const after = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_id = 'q1'")
      .first<{ n: number }>();
    expect(after?.n).toBe(before?.n);
  });

  it("AC-4: confirmed 後の rejected は 409", async () => {
    await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    const res = await postResolve(env, { action: "rejected", reason: "x" });
    expect(res.status).toBe(409);
  });

  it("AC-5: resolve 成功で audit_log に 1 件追加", async () => {
    await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    const row = await env.db
      .prepare(
        "SELECT action FROM audit_log WHERE target_id = 'q1' AND action = 'admin.tag.queue_resolved'",
      )
      .first<{ action: string }>();
    expect(row?.action).toBe("admin.tag.queue_resolved");
  });

  it("AC-6: 未知 tagCode は 422", async () => {
    const res = await postResolve(env, { action: "confirmed", tagCodes: ["unknown-code"] });
    expect(res.status).toBe(422);
  });

  it("AC-7: 削除済み member は 422", async () => {
    await env.db
      .prepare("UPDATE member_status SET is_deleted = 1 WHERE member_id = 'm1'")
      .run();
    const res = await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] });
    expect(res.status).toBe(422);
  });

  it("未存在 queueId は 404", async () => {
    const res = await postResolve(env, { action: "confirmed", tagCodes: ["tag-1"] }, "q_x");
    expect(res.status).toBe(404);
  });
});
