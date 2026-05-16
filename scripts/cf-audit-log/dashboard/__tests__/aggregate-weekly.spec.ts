import { describe, expect, it } from "vitest";
import { aggregateWeeklySummaries, parseSummaryJson } from "../aggregate-weekly.ts";

function summary(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schema_version: "1.0.0",
    week_starting: "2026-W18",
    expectedSnapshots: 168,
    actualSnapshots: 168,
    fallbackRateMean: 0.01,
    issuesOpenedTotal: 2,
    p95LatencyMedianMs: 120,
    leakageHits: 0,
    thresholdSnapshots: 0,
    mlSnapshots: 168,
    ...overrides,
  });
}

describe("parseSummaryJson", () => {
  it("accepts versioned summaries with explicit week_starting", () => {
    const parsed = parseSummaryJson(summary(), "week-18.json");
    expect(parsed.week?.week_starting).toBe("2026-W18");
    expect(parsed.week?.period).toBe("ml");
  });

  it("derives ISO week when schema_version 1.0.0 lacks week_starting", () => {
    const parsed = parseSummaryJson(
      summary({ week_starting: undefined, generated_at: "2026-01-01T00:00:00Z" }),
      "new-year.json",
    );
    expect(parsed.week?.week_starting).toBe("2026-W01");
  });

  it("marks missing schema_version legacy JSON as skipped", () => {
    const parsed = parseSummaryJson(summary({ schema_version: undefined }), "legacy.json");
    expect(parsed.week).toBeUndefined();
    expect(parsed.warning).toContain("missing schema_version");
  });

  it("throws on unsupported explicit version", () => {
    expect(() => parseSummaryJson(summary({ schema_version: "2.0.0" }), "future.json")).toThrow(
      /unsupported weekly summary/,
    );
  });

  it("throws on non-string schema_version", () => {
    expect(() => parseSummaryJson(summary({ schema_version: 1 }), "bad.json")).toThrow(
      /schema_version must be a string/,
    );
  });
});

describe("aggregateWeeklySummaries", () => {
  it("aggregates four weeks in order", () => {
    const trend = aggregateWeeklySummaries(
      [
        { name: "w20.json", content: summary({ week_starting: "2026-W20", fallbackRateMean: 0.04 }) },
        { name: "w18.json", content: summary({ week_starting: "2026-W18", fallbackRateMean: 0.01 }) },
        { name: "w19.json", content: summary({ week_starting: "2026-W19", fallbackRateMean: 0.02 }) },
        { name: "w21.json", content: summary({ week_starting: "2026-W21", fallbackRateMean: 0.03 }) },
      ],
      new Date("2026-05-14T00:00:00Z"),
    );
    expect(trend.weeks.map((w) => w.week_starting)).toEqual([
      "2026-W18",
      "2026-W19",
      "2026-W20",
      "2026-W21",
    ]);
    expect(trend.metrics.fallback_rate).toEqual([0.01, 0.02, 0.04, 0.03]);
  });

  it("keeps missing weeks as gaps rather than fabricating data", () => {
    const trend = aggregateWeeklySummaries([
      { name: "w18.json", content: summary({ week_starting: "2026-W18" }) },
      { name: "w21.json", content: summary({ week_starting: "2026-W21" }) },
    ]);
    expect(trend.weeks.map((w) => w.week_starting)).toEqual(["2026-W18", "2026-W21"]);
  });

  it("separates threshold, ml, and mixed periods", () => {
    const trend = aggregateWeeklySummaries([
      { name: "threshold.json", content: summary({ week_starting: "2026-W18", thresholdSnapshots: 168, mlSnapshots: 0 }) },
      { name: "mixed.json", content: summary({ week_starting: "2026-W19", thresholdSnapshots: 10, mlSnapshots: 158 }) },
      { name: "ml.json", content: summary({ week_starting: "2026-W20", thresholdSnapshots: 0, mlSnapshots: 168 }) },
    ]);
    expect(trend.weeks.map((w) => w.period)).toEqual(["threshold", "mixed", "ml"]);
  });
});
