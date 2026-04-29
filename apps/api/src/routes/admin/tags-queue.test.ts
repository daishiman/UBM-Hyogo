// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsQueueRoute } from "./tags-queue";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
});

const seedQueue = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      "INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('tag_1','tag-1','Tag 1','interest')",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES ('q1','m1','r1','queued','[\"tag_1\"]')",
    )
    .run();
};

describe("admin tags queue", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedQueue(env);
  }, 30000);

  it("authz: 401", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request("/tags/queue", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("GET 200", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request(
      "/tags/queue",
      { headers: { Authorization: "Bearer t" } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number };
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it("resolve: queued -> reviewing -> resolved を経由して 200", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request(
      "/tags/queue/q1/resolve",
      {
        method: "POST",
        headers: { Authorization: "Bearer t", "content-type": "application/json" },
        body: "{}",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { queue: { status: string } };
    expect(body.queue.status).toBe("resolved");
    const tag = await env.db
      .prepare("SELECT tag_id FROM member_tags WHERE member_id = 'm1' AND tag_id = 'tag_1'")
      .first<{ tag_id: string }>();
    expect(tag?.tag_id).toBe("tag_1");
  });

  it("未存在 queueId は 404", async () => {
    const app = createAdminTagsQueueRoute();
    const res = await app.request(
      "/tags/queue/q_x/resolve",
      {
        method: "POST",
        headers: { Authorization: "Bearer t", "content-type": "application/json" },
        body: "{}",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });
});
