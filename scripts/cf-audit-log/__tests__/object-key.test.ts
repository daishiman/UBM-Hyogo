import { describe, expect, it } from "vitest";
import { buildObjectKey, enumerateDayPartitions, normalizeUtcDay } from "../object-key.ts";

describe("object-key", () => {
  it("buildObjectKey produces UTC-fixed prefixed key", () => {
    const k = buildObjectKey(new Date("2026-05-07T23:59:59Z"));
    expect(k.toString()).toBe(
      "audit/v1/yyyy=2026/mm=05/dd=07/cf-audit-log-20260507.jsonl.gz",
    );
    expect(k.policyVersion).toBe("v1");
  });

  it("normalizeUtcDay truncates to 00:00:00 UTC", () => {
    const d = normalizeUtcDay(new Date("2026-05-07T15:30:00Z"));
    expect(d.toISOString()).toBe("2026-05-07T00:00:00.000Z");
  });

  it("enumerateDayPartitions splits half-open range into 1-day partitions", () => {
    const parts = enumerateDayPartitions(
      new Date("2026-05-01T00:00:00Z"),
      new Date("2026-05-04T00:00:00Z"),
    );
    expect(parts).toHaveLength(3);
    expect(parts[0]!.dd).toBe(1);
    expect(parts[2]!.dd).toBe(3);
  });

  it("enumerateDayPartitions returns empty for from >= to", () => {
    expect(
      enumerateDayPartitions(new Date("2026-05-04Z"), new Date("2026-05-04Z")),
    ).toEqual([]);
  });
});
