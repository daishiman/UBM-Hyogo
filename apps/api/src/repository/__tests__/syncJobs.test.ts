// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as syncJobs from "../syncJobs";
import {
  ALLOWED_TRANSITIONS,
  IllegalStateTransition,
  SyncJobNotFound,
} from "../syncJobs";

describe("syncJobs (lifecycle 一方向)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("ALLOWED_TRANSITIONS は running -> succeeded/failed のみ", () => {
    expect(ALLOWED_TRANSITIONS.running).toEqual(["succeeded", "failed"]);
    expect(ALLOWED_TRANSITIONS.succeeded).toEqual([]);
    expect(ALLOWED_TRANSITIONS.failed).toEqual([]);
  });

  it("start -> succeed が成功する", async () => {
    const job = await syncJobs.start(env.ctx, "schema_sync");
    expect(job.status).toBe("running");
    const done = await syncJobs.succeed(env.ctx, job.jobId, { count: 3 });
    expect(done.status).toBe("succeeded");
    expect(done.metrics).toEqual({ count: 3 });
    expect(done.finishedAt).not.toBeNull();
  });

  it("start -> fail が成功する", async () => {
    const job = await syncJobs.start(env.ctx, "response_sync");
    const failed = await syncJobs.fail(env.ctx, job.jobId, { msg: "boom" });
    expect(failed.status).toBe("failed");
    expect(failed.error).toEqual({ msg: "boom" });
  });

  it("AC-8: succeeded -> failed の逆遷移は IllegalStateTransition", async () => {
    const job = await syncJobs.start(env.ctx, "schema_sync");
    await syncJobs.succeed(env.ctx, job.jobId, {});
    await expect(syncJobs.fail(env.ctx, job.jobId, {})).rejects.toBeInstanceOf(
      IllegalStateTransition,
    );
  });

  it("AC-8: terminal update は running 条件付きで上書きを防ぐ", async () => {
    const job = await syncJobs.start(env.ctx, "schema_sync");
    await env.db
      .prepare(
        "UPDATE sync_jobs SET status = 'failed', finished_at = ?1, error_json = ?2 WHERE job_id = ?3 AND status = 'running'",
      )
      .bind(new Date().toISOString(), JSON.stringify({ msg: "other worker" }), job.jobId)
      .run();

    await expect(
      syncJobs.succeed(env.ctx, job.jobId, { count: 1 }),
    ).rejects.toBeInstanceOf(IllegalStateTransition);

    const latest = await syncJobs.listRecent(env.ctx, 1);
    expect(latest[0]?.status).toBe("failed");
  });

  it("AC-8: failed -> succeeded の逆遷移は IllegalStateTransition", async () => {
    const job = await syncJobs.start(env.ctx, "schema_sync");
    await syncJobs.fail(env.ctx, job.jobId, {});
    await expect(
      syncJobs.succeed(env.ctx, job.jobId, {}),
    ).rejects.toBeInstanceOf(IllegalStateTransition);
  });

  it("存在しない job_id は SyncJobNotFound", async () => {
    await expect(
      syncJobs.succeed(env.ctx, "missing_id", {}),
    ).rejects.toBeInstanceOf(SyncJobNotFound);
  });

  it("findLatest / listRecent", async () => {
    const a = await syncJobs.start(env.ctx, "schema_sync");
    await new Promise((r) => setTimeout(r, 5));
    const b = await syncJobs.start(env.ctx, "schema_sync");
    const latest = await syncJobs.findLatest(env.ctx, "schema_sync");
    expect(latest?.jobId).toBe(b.jobId);
    const list = await syncJobs.listRecent(env.ctx, 10);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.map((r) => r.jobId)).toContain(a.jobId);
  });
});
