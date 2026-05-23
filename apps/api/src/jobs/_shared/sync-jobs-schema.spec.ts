import { describe, expect, it } from "vitest";
import {
  assertNoPii,
  metricsJsonBaseSchema,
  parseMetricsJson,
  RESPONSE_SYNC,
  responseSyncMetricsSchema,
  SCHEMA_SYNC,
  schemaSyncMetricsSchema,
  SYNC_JOB_TYPES,
  SYNC_LOCK_TTL_MINUTES,
  SYNC_LOCK_TTL_MS,
} from "./sync-jobs-schema";

describe("sync-jobs-schema", () => {
  it("exports canonical job types and lock TTL", () => {
    expect(SYNC_JOB_TYPES).toEqual(["schema_sync", "response_sync"]);
    expect(SYNC_JOB_TYPES).toEqual([SCHEMA_SYNC, RESPONSE_SYNC]);
    expect(SYNC_LOCK_TTL_MINUTES).toBe(10);
    expect(SYNC_LOCK_TTL_MS).toBe(600000);
  });

  it("parses response_sync metrics and falls back on invalid JSON", () => {
    expect(
      parseMetricsJson(
        JSON.stringify({ cursor: "2026-01-01T00:00:00Z|r-1", writes: 3 }),
        responseSyncMetricsSchema,
        {},
      ),
    ).toMatchObject({ cursor: "2026-01-01T00:00:00Z|r-1", writes: 3 });

    expect(parseMetricsJson("{", responseSyncMetricsSchema, {})).toEqual({});
  });

  it("accepts schema_sync count metrics", () => {
    expect(
      schemaSyncMetricsSchema.parse({ write_count: 2, processed_count: 2 }),
    ).toMatchObject({ write_count: 2, processed_count: 2 });
  });

  it("rejects PII-like keys in metrics_json", () => {
    expect(() =>
      assertNoPii({ cursor: "c1", nested: { response_email: "a@example.com" } }),
    ).toThrow(/response_email/);
    expect(() => assertNoPii({ cursor: "c1", writes: 1 })).not.toThrow();
  });

  it("rejects email-shaped values even under non-PII keys", () => {
    expect(() =>
      metricsJsonBaseSchema.parse({ cursor: "c1", source: "a@example.com" }),
    ).toThrow(/source=<email>/);
  });
});
