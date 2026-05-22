import { describe, expect, it } from "vitest";

import {
  SyncLogRecordZ,
  SyncLogStatusZ,
  SyncTriggerTypeZ,
  type SyncLogRecord,
} from "./sync-log";

// ------------------------------------------------------------
// fixture
// ------------------------------------------------------------

const validRow = {
  id: 1,
  run_id: "00000000-0000-4000-8000-000000000001",
  trigger_type: "cron",
  status: "success",
  started_at: "2026-05-17T00:00:00.000+09:00",
  finished_at: "2026-05-17T00:01:00.000+09:00",
  fetched_count: 10,
  upserted_count: 10,
  failed_count: 0,
  retry_count: 0,
  duration_ms: 60000,
  error_reason: null,
} as const;

const nullableRow = {
  ...validRow,
  finished_at: null,
  duration_ms: null,
  error_reason: null,
};

// ------------------------------------------------------------
// SyncLogStatusZ
// ------------------------------------------------------------

describe("SyncLogStatusZ — canonical enum (issue #266 §1.3)", () => {
  it.each(["running", "success", "failed", "skipped"] as const)(
    "accepts canonical value '%s'",
    (v) => {
      expect(SyncLogStatusZ.safeParse(v).success).toBe(true);
    },
  );

  it("rejects typo 'succeeded' (sync_jobs 由来の旧値)", () => {
    expect(SyncLogStatusZ.safeParse("succeeded").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(SyncLogStatusZ.safeParse("").success).toBe(false);
  });
});

// ------------------------------------------------------------
// SyncTriggerTypeZ
// ------------------------------------------------------------

describe("SyncTriggerTypeZ — canonical enum (物理 DDL 一致)", () => {
  it.each(["cron", "admin", "backfill"] as const)(
    "accepts canonical value '%s'",
    (v) => {
      expect(SyncTriggerTypeZ.safeParse(v).success).toBe(true);
    },
  );

  it.each(["manual", "scheduled"] as const)(
    "rejects legacy TS value '%s' (issue #266 で正規化)",
    (v) => {
      expect(SyncTriggerTypeZ.safeParse(v).success).toBe(false);
    },
  );
});

// ------------------------------------------------------------
// SyncLogRecordZ
// ------------------------------------------------------------

describe("SyncLogRecordZ — 12-column physical row schema", () => {
  it("parses full 12-column valid row", () => {
    const r = SyncLogRecordZ.safeParse(validRow);
    expect(r.success).toBe(true);
  });

  it("parses null-permitted row (finished_at / duration_ms / error_reason)", () => {
    expect(SyncLogRecordZ.safeParse(nullableRow).success).toBe(true);
  });

  it("rejects retry_count: -1 (nonnegative 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, retry_count: -1 }).success,
    ).toBe(false);
  });

  it("rejects status: 'unknown'", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, status: "unknown" }).success,
    ).toBe(false);
  });

  it("rejects trigger_type: 'manual' (legacy TS value)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, trigger_type: "manual" }).success,
    ).toBe(false);
  });

  it("rejects id: 0 (positive 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, id: 0 }).success,
    ).toBe(false);
  });

  it("rejects run_id: '' (NonEmptyStringZ 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, run_id: "" }).success,
    ).toBe(false);
  });

  it("rejects started_at: '2026-05-17 00:00:00' (Iso8601 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({
        ...validRow,
        started_at: "2026-05-17 00:00:00",
      }).success,
    ).toBe(false);
  });
});

// ------------------------------------------------------------
// 型整合 (compile-time)
// ------------------------------------------------------------

describe("type-level: z.infer<typeof SyncLogRecordZ> ≡ SyncLogRecord", () => {
  it("infers identical type to exported SyncLogRecord", () => {
    const parsed = SyncLogRecordZ.parse(validRow);
    const _check: SyncLogRecord = parsed;
    expect(_check.id).toBe(validRow.id);
  });
});
