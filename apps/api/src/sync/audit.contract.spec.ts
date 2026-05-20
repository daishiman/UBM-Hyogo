// @vitest-environment node
// u-04: audit writer + withSyncMutex の単体テスト (U-A-01..08, U-X-01..04)。

import { describe, it, expect } from "vitest";
import { SyncLogStatusZ, SyncTriggerTypeZ } from "@ubm-hyogo/shared";
import { setupD1 } from "../repository/__tests__/_setup";
import {
  startRun,
  finishRun,
  withSyncMutex,
  listRecent,
} from "./audit";
import type { AuditDeps, DiffSummary } from "./types";

const fixedNow = (iso: string) => () => new Date(iso);

function depsFor(db: D1Database, ts: string, id = "run-1"): AuditDeps {
  return { db, now: fixedNow(ts), newId: () => id };
}

describe("u-04 audit", () => {
  it("U-A-01: startRun が running 行を 1 件 insert する", async () => {
    const env = await setupD1();
    const deps = depsFor(env.db, "2026-04-30T00:00:00.000Z", "r1");
    const { result } = await startRun(deps, "admin");
    expect(result.acquired).toBe(true);
    const row = await env.db
      .prepare("SELECT status, trigger_type FROM sync_job_logs WHERE run_id = ?1")
      .bind("r1")
      .first<{ status: string; trigger_type: string }>();
    expect(row?.status).toBe("running");
    expect(row?.trigger_type).toBe("admin");
  });

  it("U-A-02: 二重 startRun は 2 件目を skipped で記録する", async () => {
    const env = await setupD1();
    await env.reset();
    const a = depsFor(env.db, "2026-04-30T00:00:00.000Z", "r-a");
    const b = depsFor(env.db, "2026-04-30T00:00:01.000Z", "r-b");
    await startRun(a, "admin");
    const second = await startRun(b, "admin");
    expect(second.result.acquired).toBe(false);
    const row = await env.db
      .prepare("SELECT status FROM sync_job_logs WHERE run_id = ?1")
      .bind("r-b")
      .first<{ status: string }>();
    expect(row?.status).toBe("skipped");
  });

  it("U-A-03: finishRun が running を success に上書きする", async () => {
    const env = await setupD1();
    await env.reset();
    const deps = depsFor(env.db, "2026-04-30T00:00:00.000Z", "r-fin");
    await startRun(deps, "admin");
    const summary: DiffSummary = {
      fetched: 3,
      upserted: 3,
      failed: 0,
      retryCount: 1,
      durationMs: 42,
    };
    await finishRun(
      { ...deps, now: fixedNow("2026-04-30T00:00:01.000Z") },
      "r-fin",
      "success",
      summary,
      null,
    );
    const row = await env.db
      .prepare(
        "SELECT status, fetched_count, upserted_count, retry_count, duration_ms FROM sync_job_logs WHERE run_id = ?1",
      )
      .bind("r-fin")
      .first<{
        status: string;
        fetched_count: number;
        upserted_count: number;
        retry_count: number;
        duration_ms: number;
      }>();
    expect(row?.status).toBe("success");
    expect(row?.fetched_count).toBe(3);
    expect(row?.upserted_count).toBe(3);
    expect(row?.retry_count).toBe(1);
    expect(row?.duration_ms).toBe(42);
  });

  it("U-X-01: withSyncMutex が success 経路で finalize する", async () => {
    const env = await setupD1();
    await env.reset();
    const deps = depsFor(env.db, "2026-04-30T00:00:00.000Z", "wm-ok");
    const r = await withSyncMutex(deps, "admin", async () => ({
      fetched: 1,
      upserted: 1,
      failed: 0,
      retryCount: 0,
      durationMs: 0,
    }));
    expect(r.status).toBe("success");
    const lock = await env.db.prepare("SELECT id FROM sync_locks").first();
    expect(lock).toBeNull();
  });

  it("U-X-02: 内部 throw でも finishRun が failed で確定し lock も解放される", async () => {
    const env = await setupD1();
    await env.reset();
    const deps = depsFor(env.db, "2026-04-30T00:00:00.000Z", "wm-ng");
    const r = await withSyncMutex(deps, "cron", async () => {
      throw new Error("boom user@example.com");
    });
    expect(r.status).toBe("failed");
    expect(r.errorReason).toContain("boom");
    expect(r.errorReason).not.toContain("user@example.com");
    const lock = await env.db.prepare("SELECT id FROM sync_locks").first();
    expect(lock).toBeNull();
  });

  it("U-X-03: 二重実行時に 2 本目は skipped を返す", async () => {
    const env = await setupD1();
    await env.reset();
    const a = depsFor(env.db, "2026-04-30T00:00:00.000Z", "wm-a");
    const b = depsFor(env.db, "2026-04-30T00:00:00.500Z", "wm-b");
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const p1 = withSyncMutex(a, "admin", async () => {
      await gate;
      return { fetched: 0, upserted: 0, failed: 0, retryCount: 0, durationMs: 0 };
    });
    const r2 = await withSyncMutex(b, "admin", async () => ({
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount: 0,
      durationMs: 0,
    }));
    expect(r2.status).toBe("skipped");
    release();
    await p1;
  });

  it("U-A-08: listRecent は started_at desc + limit を respect する", async () => {
    const env = await setupD1();
    await env.reset();
    for (let i = 0; i < 3; i += 1) {
      const deps = depsFor(
        env.db,
        `2026-04-30T00:00:0${i}.000Z`,
        `rec-${i}`,
      );
      await withSyncMutex(deps, "admin", async () => ({
        fetched: i,
        upserted: i,
        failed: 0,
        retryCount: 0,
        durationMs: 0,
      }));
    }
    const items = await listRecent(env.db, 2);
    expect(items).toHaveLength(2);
    expect(items[0]!.auditId).toBe("rec-2");
    expect(items[1]!.auditId).toBe("rec-1");
  });

  it("issue-266: listRecent rows pass shared SyncTriggerTypeZ / SyncLogStatusZ", async () => {
    const env = await setupD1();
    await env.reset();
    const triggers = ["admin", "cron", "backfill"] as const;
    for (let i = 0; i < triggers.length; i += 1) {
      const deps = depsFor(
        env.db,
        `2026-05-17T00:00:0${i}.000Z`,
        `shared-${i}`,
      );
      await withSyncMutex(deps, triggers[i]!, async () => ({
        fetched: 0,
        upserted: 0,
        failed: 0,
        retryCount: 0,
        durationMs: 0,
      }));
    }
    const rows = await listRecent(env.db, 10);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(SyncTriggerTypeZ.safeParse(r.trigger).success).toBe(true);
      expect(SyncLogStatusZ.safeParse(r.status).success).toBe(true);
    }
  });

  it("issue-266: listRecent filters legacy trigger rows before shared row parse", async () => {
    const env = await setupD1();
    await env.reset();
    await env.db
      .prepare(
        `INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at, finished_at)
         VALUES ('legacy-manual', 'manual', 'success', '2026-05-17T00:00:00.000Z', '2026-05-17T00:00:01.000Z')`,
      )
      .run();
    const deps = depsFor(env.db, "2026-05-17T00:00:02.000Z", "canonical-admin");
    await withSyncMutex(deps, "admin", async () => ({
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount: 0,
      durationMs: 0,
    }));

    const rows = await listRecent(env.db, 10);
    expect(rows.map((r) => r.auditId)).toContain("canonical-admin");
    expect(rows.map((r) => r.auditId)).not.toContain("legacy-manual");
  });
});
