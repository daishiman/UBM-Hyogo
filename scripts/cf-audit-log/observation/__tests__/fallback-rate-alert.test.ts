import { describe, expect, it, vi } from "vitest";
import {
  buildIssueBody,
  evaluateAndAlert,
  evaluateConsecutive,
  parseArgs,
} from "../fallback-rate-alert.ts";
import type { HourlySnapshot } from "../post-switch-monitor.ts";

function makeSnapshot(hour: string, fallbackRate: number): HourlySnapshot {
  return {
    hour,
    classifierUsed: "ml",
    classifierVersion: "ml@v1",
    totalEvents: 100,
    issuesOpenedThisHour: 0,
    fallbackRate,
    p95LatencyMs: 50,
    leakageGrepResult: "clean",
  };
}

describe("parseArgs", () => {
  it("uses default window=3 / threshold=0.05", () => {
    const args = parseArgs([]);
    expect(args.window).toBe(3);
    expect(args.threshold).toBeCloseTo(0.05);
    expect(args.dryRun).toBe(false);
  });

  it("rejects invalid threshold", () => {
    expect(() => parseArgs(["--threshold=2"])).toThrow();
    expect(() => parseArgs(["--threshold=0"])).toThrow();
  });

  it("rejects invalid window", () => {
    expect(() => parseArgs(["--window=0"])).toThrow();
  });
});

describe("evaluateConsecutive", () => {
  it("triggers when last N hours all exceed threshold", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.01),
      makeSnapshot("2026-05-08T01:00:00Z", 0.06),
      makeSnapshot("2026-05-08T02:00:00Z", 0.07),
      makeSnapshot("2026-05-08T03:00:00Z", 0.08),
    ];
    const result = evaluateConsecutive(snaps, 0.05, 3);
    expect(result.triggered).toBe(true);
    expect(result.observed).toHaveLength(3);
  });

  it("does not trigger when most recent is within threshold", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.07),
      makeSnapshot("2026-05-08T01:00:00Z", 0.08),
      makeSnapshot("2026-05-08T02:00:00Z", 0.04),
    ];
    expect(evaluateConsecutive(snaps, 0.05, 3).triggered).toBe(false);
  });

  it("returns false when not enough snapshots", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.99),
      makeSnapshot("2026-05-08T01:00:00Z", 0.99),
    ];
    const r = evaluateConsecutive(snaps, 0.05, 3);
    expect(r.triggered).toBe(false);
    expect(r.reason).toMatch(/not enough/);
  });

  it("handles empty input safely", () => {
    expect(evaluateConsecutive([], 0.05, 3).triggered).toBe(false);
  });
});

describe("buildIssueBody", () => {
  it("renders observed snapshots and Refs", () => {
    const evaluation = evaluateConsecutive(
      [
        makeSnapshot("2026-05-08T00:00:00Z", 0.06),
        makeSnapshot("2026-05-08T01:00:00Z", 0.07),
        makeSnapshot("2026-05-08T02:00:00Z", 0.08),
      ],
      0.05,
      3,
    );
    const body = buildIssueBody(evaluation);
    expect(body).toContain("Refs #549");
    expect(body).toContain("2026-05-08T00:00:00Z");
    expect(body).toContain("8.00%");
  });
});

describe("evaluateAndAlert", () => {
  const triggerSnaps = [
    makeSnapshot("2026-05-08T00:00:00Z", 0.06),
    makeSnapshot("2026-05-08T01:00:00Z", 0.07),
    makeSnapshot("2026-05-08T02:00:00Z", 0.08),
  ];

  it("dry-run does not call createIssue even when triggered", async () => {
    const createIssue = vi.fn();
    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: true,
      createIssue,
    });
    expect(result.evaluation.triggered).toBe(true);
    expect(result.issueUrl).toBeUndefined();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("calls createIssue when triggered and not dry-run", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://example.com/issues/1");
    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
    });
    expect(result.issueUrl).toBe("https://example.com/issues/1");
    expect(createIssue).toHaveBeenCalledTimes(1);
    const arg = createIssue.mock.calls[0][0];
    expect(arg.repo).toBe("daishiman/UBM-Hyogo");
    expect(arg.labels).toContain("type:incident");
  });

  it("does not call createIssue when not triggered", async () => {
    const createIssue = vi.fn();
    await evaluateAndAlert({
      snapshots: [makeSnapshot("h", 0.01), makeSnapshot("h2", 0.02), makeSnapshot("h3", 0.03)],
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "x/y",
      token: "t",
      createIssue,
    });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("requires repo+token when triggered and not dry-run", async () => {
    await expect(
      evaluateAndAlert({
        snapshots: triggerSnaps,
        window: 3,
        threshold: 0.05,
        dryRun: false,
      }),
    ).rejects.toThrow(/token/);
  });
});
