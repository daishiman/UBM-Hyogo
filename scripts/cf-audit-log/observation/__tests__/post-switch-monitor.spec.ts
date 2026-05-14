import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  aggregateSnapshots,
  assertNonSkeletonSnapshots,
  buildSkeletonSnapshot,
  parseArgs,
  readSnapshotsFromDir,
  renderSummaryMarkdown,
  runCli,
  type HourlySnapshot,
} from "../post-switch-monitor.ts";

function makeSnapshot(overrides: Partial<HourlySnapshot> = {}): HourlySnapshot {
  return {
    hour: "2026-05-08T00:00:00Z",
    classifierUsed: "ml",
    classifierVersion: "ml@v1",
    totalEvents: 100,
    issuesOpenedThisHour: 1,
    fallbackRate: 0.02,
    p95LatencyMs: 50,
    leakageGrepResult: "clean",
    ...overrides,
  };
}

describe("parseArgs", () => {
  it("parses snapshot mode flags", () => {
    const args = parseArgs(["--hour=2026-05-08T00:00:00Z", "--out=/tmp/x.json"]);
    expect(args.aggregate).toBe(false);
    expect(args.hour).toBe("2026-05-08T00:00:00Z");
    expect(args.out).toBe("/tmp/x.json");
  });

  it("parses aggregate mode flags", () => {
    const args = parseArgs(["--aggregate", "--input=outputs/obs", "--format=markdown"]);
    expect(args.aggregate).toBe(true);
    expect(args.input).toBe("outputs/obs");
    expect(args.format).toBe("markdown");
  });

  it("accepts runbook-compatible aliases", () => {
    const args = parseArgs([
      "--aggregate=7d",
      "--in=outputs/obs",
      "--output=/tmp/summary.json",
      "--window=168h",
    ]);
    expect(args.aggregate).toBe(true);
    expect(args.input).toBe("outputs/obs");
    expect(args.out).toBe("/tmp/summary.json");
  });

  it("rejects unsupported format", () => {
    expect(() => parseArgs(["--format=yaml"])).toThrow(/format=yaml/);
  });
});

describe("aggregateSnapshots", () => {
  it("computes mean / max / counts across snapshots", () => {
    const snaps = [
      makeSnapshot({ hour: "2026-05-08T00:00:00Z", fallbackRate: 0.01, p95LatencyMs: 30 }),
      makeSnapshot({ hour: "2026-05-08T01:00:00Z", fallbackRate: 0.05, p95LatencyMs: 60 }),
      makeSnapshot({
        hour: "2026-05-08T02:00:00Z",
        fallbackRate: 0.09,
        p95LatencyMs: 90,
        leakageGrepResult: "dirty",
        classifierUsed: "threshold",
      }),
    ];
    const summary = aggregateSnapshots(snaps);
    expect(summary.expectedSnapshots).toBe(3);
    expect(summary.actualSnapshots).toBe(3);
    expect(summary.windowHours).toBe(3);
    expect(summary.fallbackRateMax).toBeCloseTo(0.09);
    expect(summary.fallbackRateMean).toBeCloseTo(0.05);
    expect(summary.p95LatencyMedianMs).toBe(60);
    expect(summary.leakageHits).toBe(1);
    expect(summary.thresholdSnapshots).toBe(1);
    expect(summary.mlSnapshots).toBe(2);
    expect(summary.issuesOpenedTotal).toBe(3);
  });

  it("throws on empty input", () => {
    expect(() => aggregateSnapshots([])).toThrow();
  });
});

describe("assertNonSkeletonSnapshots", () => {
  it("rejects all-zero skeleton metrics", () => {
    expect(() =>
      assertNonSkeletonSnapshots([
        makeSnapshot({ totalEvents: 0, issuesOpenedThisHour: 0, fallbackRate: 0, p95LatencyMs: 0 }),
        makeSnapshot({ totalEvents: 0, issuesOpenedThisHour: 0, fallbackRate: 0, p95LatencyMs: 0 }),
      ]),
    ).toThrow(/skeleton zero metrics/);
  });

  it("accepts snapshots with real observed metrics", () => {
    expect(() =>
      assertNonSkeletonSnapshots([
        makeSnapshot({ totalEvents: 0, issuesOpenedThisHour: 0, fallbackRate: 0, p95LatencyMs: 0 }),
        makeSnapshot({ totalEvents: 10, issuesOpenedThisHour: 1, fallbackRate: 0.02, p95LatencyMs: 42 }),
      ]),
    ).not.toThrow();
  });
});

describe("renderSummaryMarkdown", () => {
  it("includes percentage and counts", () => {
    const md = renderSummaryMarkdown({
      expectedSnapshots: 168,
      actualSnapshots: 168,
      windowHours: 168,
      fallbackRateMean: 0.012,
      fallbackRateMax: 0.04,
      issuesOpenedTotal: 12,
      p95LatencyMedianMs: 42,
      leakageHits: 0,
      thresholdSnapshots: 4,
      mlSnapshots: 164,
    });
    expect(md).toContain("window hours: 168");
    expect(md).toContain("expected snapshots: 168");
    expect(md).toContain("actual snapshots: 168");
    expect(md).toContain("1.20%");
    expect(md).toContain("leakage hits: 0");
  });
});

describe("buildSkeletonSnapshot", () => {
  it("reads classifier from env and defaults leakage to clean", () => {
    const prev = process.env.CF_AUDIT_CLASSIFIER;
    process.env.CF_AUDIT_CLASSIFIER = "ml";
    delete process.env.LEAKAGE_GREP_RESULT;
    try {
      const s = buildSkeletonSnapshot("2026-05-08T03:00:00Z");
      expect(s.classifierUsed).toBe("ml");
      expect(s.leakageGrepResult).toBe("clean");
      expect(s.hour).toBe("2026-05-08T03:00:00Z");
    } finally {
      process.env.CF_AUDIT_CLASSIFIER = prev;
    }
  });

  it("uses analyze summary metrics when provided", () => {
    const s = buildSkeletonSnapshot("2026-05-08T03:00:00Z", {
      totalEvents: 7,
      findings: 2,
      classifierUsed: "ml",
      classifierVersion: "ml@artifact",
      fallbackActive: true,
      elapsedMs: 123,
    });
    expect(s.totalEvents).toBe(7);
    expect(s.issuesOpenedThisHour).toBe(2);
    expect(s.classifierUsed).toBe("ml");
    expect(s.classifierVersion).toBe("ml@artifact");
    expect(s.fallbackRate).toBe(1);
    expect(s.p95LatencyMs).toBe(123);
  });
});

describe("runCli (aggregate) round-trip", () => {
  let dir: string;
  let outPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "obs-"));
    writeFileSync(
      join(dir, "h0.json"),
      JSON.stringify(makeSnapshot({ hour: "2026-05-08T00:00:00Z", fallbackRate: 0.02 })),
    );
    writeFileSync(
      join(dir, "h1.json"),
      JSON.stringify(makeSnapshot({ hour: "2026-05-08T01:00:00Z", fallbackRate: 0.04 })),
    );
    outPath = join(dir, "summary.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads dir, aggregates, writes JSON to --out", () => {
    runCli([
      "--aggregate",
      `--input=${dir}`,
      "--expected-snapshots=168",
      `--out=${outPath}`,
    ]);
    const written = JSON.parse(readFileSync(outPath, "utf8"));
    expect(written.expectedSnapshots).toBe(168);
    expect(written.actualSnapshots).toBe(2);
    expect(written.windowHours).toBe(2);
    expect(written.mlSnapshots).toBe(2);
    expect(written.fallbackRateMax).toBeCloseTo(0.04);
  });

  it("readSnapshotsFromDir orders by hour", () => {
    const snaps = readSnapshotsFromDir(dir);
    expect(snaps.map((s) => s.hour)).toEqual([
      "2026-05-08T00:00:00Z",
      "2026-05-08T01:00:00Z",
    ]);
  });
});
