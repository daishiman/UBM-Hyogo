// 03b-followup-006: cap-alert detector / emitter unit test (T-1〜T-10)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeD1 } from "./__fixtures__/d1-fake";
import {
  evaluateConsecutiveCapHits,
  emitConsecutiveCapHitEvent,
} from "./cap-alert";
import { RESPONSE_SYNC } from "./_shared/sync-jobs-schema";

interface SeedRow {
  jobId: string;
  startedAt: string;
  writeCapHit?: boolean | null; // null = absent
  status?: "succeeded" | "failed" | "running";
  jobType?: string;
  skipped?: boolean;
}

const seedJob = (db: FakeD1, row: SeedRow): void => {
  const metrics: Record<string, unknown> = {};
  if (row.writeCapHit !== null && row.writeCapHit !== undefined) {
    metrics.writeCapHit = row.writeCapHit;
  }
  if (row.skipped) metrics.skipped = true;
  db.syncJobs.push({
    job_id: row.jobId,
    job_type: row.jobType ?? RESPONSE_SYNC,
    started_at: row.startedAt,
    finished_at: row.startedAt,
    status: row.status ?? "succeeded",
    metrics_json: JSON.stringify(metrics),
    error_json: null,
  });
};

describe("evaluateConsecutiveCapHits", () => {
  let db: FakeD1;
  beforeEach(() => {
    db = new FakeD1();
  });

  it("T-1: sync_jobs に 0 行 → thresholdReached=false / consecutiveHits=0", async () => {
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(false);
    expect(result.consecutiveHits).toBe(0);
    expect(result.shouldEmit).toBe(false);
  });

  it("T-2: 直近 3 行のうち 1 行のみ writeCapHit=true → 連続でない", async () => {
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:00:00Z", writeCapHit: false });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:30:00Z", writeCapHit: false });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(false);
    expect(result.consecutiveHits).toBe(0);
  });

  it("T-3: 直近 3 行すべて writeCapHit=true → thresholdReached=true / consecutiveHits=3", async () => {
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(true);
    expect(result.consecutiveHits).toBe(3);
  });

  it("T-4: 直近 3 件すべて true、4 件目 false → shouldEmit=true", async () => {
    seedJob(db, { jobId: "j-0", startedAt: "2026-01-01T00:00:00Z", writeCapHit: false });
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:45:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(true);
    expect(result.previousWindowReached).toBe(false);
    expect(result.shouldEmit).toBe(true);
  });

  it("T-5: skipped=true 行は streak を reset する", async () => {
    seedJob(db, { jobId: "j-skip", startedAt: "2026-01-01T01:00:00Z", writeCapHit: false, skipped: true });
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(false);
    expect(result.consecutiveHits).toBe(0);
  });

  it("failed 行も streak を reset する", async () => {
    seedJob(db, { jobId: "j-failed", startedAt: "2026-01-01T01:00:00Z", writeCapHit: false, status: "failed" });
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(false);
    expect(result.consecutiveHits).toBe(0);
  });

  it("T-8: 直近 4 行すべて true → previousWindowReached=true で shouldEmit=false (重複抑制)", async () => {
    seedJob(db, { jobId: "j-0", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-3", startedAt: "2026-01-01T00:45:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    expect(result.thresholdReached).toBe(true);
    expect(result.previousWindowReached).toBe(true);
    expect(result.shouldEmit).toBe(false);
  });

  it("T-9: 旧行で writeCapHit が absent / null は false 解釈", async () => {
    seedJob(db, { jobId: "j-old", startedAt: "2026-01-01T00:00:00Z", writeCapHit: null });
    seedJob(db, { jobId: "j-1", startedAt: "2026-01-01T00:15:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-2", startedAt: "2026-01-01T00:30:00Z", writeCapHit: true });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 3, jobKind: RESPONSE_SYNC },
    );
    // 直近 3 件は [j-2(true), j-1(true), j-old(absent=false)] なので連続成立しない
    expect(result.thresholdReached).toBe(false);
  });

  it("T-10: started_at が同一の場合 job_id DESC で決定的", async () => {
    seedJob(db, { jobId: "j-A", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-B", startedAt: "2026-01-01T00:00:00Z", writeCapHit: true });
    seedJob(db, { jobId: "j-C", startedAt: "2026-01-01T00:00:00Z", writeCapHit: false });
    const result = await evaluateConsecutiveCapHits(
      { DB: db as unknown as D1Database },
      { window: 2, jobKind: RESPONSE_SYNC },
    );
    // ORDER BY started_at DESC, job_id DESC → j-C, j-B, j-A
    // 直近 2 件: [j-C(false), j-B(true)] → 連続なし
    expect(result.thresholdReached).toBe(false);
  });
});

describe("emitConsecutiveCapHitEvent", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("T-6: SYNC_ALERTS binding 未定義時は console.warn のみで例外 throw されない", async () => {
    await expect(
      emitConsecutiveCapHitEvent(
        { DB: new FakeD1() as unknown as D1Database },
        { jobId: "j-1", jobKind: RESPONSE_SYNC, consecutiveHits: 3, windowSize: 3 },
      ),
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("正常系: writeDataPoint が想定 payload で呼ばれる", async () => {
    const writeDataPoint = vi.fn();
    await emitConsecutiveCapHitEvent(
      {
        DB: new FakeD1() as unknown as D1Database,
        SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
      },
      { jobId: "j-1", jobKind: RESPONSE_SYNC, consecutiveHits: 3, windowSize: 3 },
    );
    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["sync_write_cap_consecutive_hit", RESPONSE_SYNC],
      doubles: [3, 3],
      indexes: ["j-1"],
    });
  });

  it("T-7: Analytics Engine emit で例外 → console.warn で握り潰され伝播しない", async () => {
    const writeDataPoint = vi.fn(() => {
      throw new Error("AE down");
    });
    await expect(
      emitConsecutiveCapHitEvent(
        {
          DB: new FakeD1() as unknown as D1Database,
          SYNC_ALERTS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
        },
        { jobId: "j-1", jobKind: RESPONSE_SYNC, consecutiveHits: 3, windowSize: 3 },
      ),
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
