import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseArgs,
  resolveOutPath,
  runCli,
  type HourlySnapshot,
} from "../post-switch-monitor.ts";

function snapshot(hour: string): HourlySnapshot {
  return {
    hour,
    classifierUsed: "ml",
    classifierVersion: "ml@v1",
    totalEvents: 100,
    issuesOpenedThisHour: 0,
    fallbackRate: 0.01,
    p95LatencyMs: 50,
    leakageGrepResult: "clean",
  };
}

describe("parseArgs --recovery-mode", () => {
  it("accepts --recovery-mode flag and --since value", () => {
    const args = parseArgs([
      "--aggregate",
      "--recovery-mode",
      "--since",
      "2026-05-15T01:00:00Z",
      "--input",
      "./x",
    ]);
    expect(args.recoveryMode).toBe(true);
    expect(args.since).toBe("2026-05-15T01:00:00Z");
    expect(args.aggregate).toBe(true);
    expect(args.input).toBe("./x");
  });

  it("accepts --recovery-mode=true / --since= syntax", () => {
    const args = parseArgs(["--recovery-mode=true", "--since=2026-05-15T01:00:00Z"]);
    expect(args.recoveryMode).toBe(true);
    expect(args.since).toBe("2026-05-15T01:00:00Z");
  });

  it("defaults recoveryMode to false", () => {
    const args = parseArgs(["--aggregate", "--input", "./x"]);
    expect(args.recoveryMode).toBe(false);
    expect(args.since).toBeUndefined();
  });
});

describe("resolveOutPath", () => {
  it("returns recovery-suffixed default when recovery-mode without --out", () => {
    const args = parseArgs(["--aggregate", "--recovery-mode", "--since=2026-05-15T01:00:00Z"]);
    expect(resolveOutPath(args)).toMatch(/hourly-run-7day-summary-recovery\.json$/);
  });

  it("returns explicit --out when provided", () => {
    const args = parseArgs(["--aggregate", "--recovery-mode", "--since=2026-05-15T01:00:00Z", "--out=/tmp/x.json"]);
    expect(resolveOutPath(args)).toBe("/tmp/x.json");
  });

  it("returns undefined for normal mode without --out (stdout)", () => {
    const args = parseArgs(["--aggregate"]);
    expect(resolveOutPath(args)).toBeUndefined();
  });
});

describe("runCli --recovery-mode", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "recovery-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("TC-RECOVERY-01: writes recovery-mode summary with expected schema", () => {
    writeFileSync(join(dir, "run-urls.tsv"), "1\thttps://github.com/o/r/actions/runs/1\n");
    writeFileSync(
      join(dir, "first.json"),
      JSON.stringify({ actualSnapshots: 1, fallbackRateMean: 0.03, leakageHits: 1 }),
    );
    writeFileSync(
      join(dir, "baseline.json"),
      JSON.stringify({ fallbackRateMean: 0.005, p95LatencyMedianMs: 45 }),
    );
    writeFileSync(join(dir, "before.json"), JSON.stringify(snapshot("2026-05-15T00:00:00Z")));
    for (let h = 1; h < 4; h++) {
      const iso = `2026-05-15T0${h}:00:00Z`;
      writeFileSync(join(dir, `s-${h}.json`), JSON.stringify(snapshot(iso)));
    }
    const out = join(dir, "out.json");
    runCli([
      "--aggregate",
      "--window",
      "168",
      "--recovery-mode",
      "--since",
      "2026-05-15T01:00:00Z",
      "--input",
      dir,
      "--out",
      out,
      "--expected-snapshots",
      "3",
      "--require-non-skeleton",
      "--run-urls",
      join(dir, "run-urls.tsv"),
      "--compare-first-cycle",
      join(dir, "first.json"),
      "--compare-baseline",
      join(dir, "baseline.json"),
    ]);
    const json = JSON.parse(readFileSync(out, "utf8"));
    expect(json.mode).toBe("recovery");
    expect(json.since).toBe("2026-05-15T01:00:00Z");
    expect(json.actualSnapshots).toBe(3);
    expect(json.leakageHourlyClean).toBe(true);
    expect(json.runUrls).toEqual(["https://github.com/o/r/actions/runs/1"]);
    expect(json.compareWith1stCycle.snapshotsDelta).toBe(2);
    expect(json.compareWith1stCycle.leakageStatusChange).toBe("became-clean");
    expect(json.compareWithBaseline.fallbackRateDelta).toBeCloseTo(0.005);
    expect(json.compareWithBaseline.p95LatencyDeltaMs).toBe(5);
    expect(json.until).toBe("2026-05-22T01:00:00.000Z");
  });

  it("TC-RECOVERY-02: exits 2 when --since is missing in recovery-mode", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`__exit_${code}__`);
      }) as never);
    const errSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      expect(() =>
        runCli(["--aggregate", "--recovery-mode", "--input", dir, "--out", join(dir, "x.json")]),
      ).toThrowError(/__exit_2__/);
      expect(errSpy.mock.calls.flat().join("")).toMatch(/since is required/);
    } finally {
      exitSpy.mockRestore();
      errSpy.mockRestore();
    }
  });

  it("TC-REGRESSION-01: normal mode output is schema-compatible (no mode/since fields when omitted)", () => {
    for (let h = 0; h < 3; h++) {
      const iso = `2026-05-08T0${h}:00:00Z`;
      writeFileSync(join(dir, `s-${h}.json`), JSON.stringify(snapshot(iso)));
    }
    const out = join(dir, "out.json");
    runCli([
      "--aggregate",
      "--input",
      dir,
      "--out",
      out,
      "--expected-snapshots",
      "3",
    ]);
    const json = JSON.parse(readFileSync(out, "utf8"));
    expect(json.mode).toBe("normal");
    expect(json.since).toBeUndefined();
    expect(json.actualSnapshots).toBe(3);
    expect(json.expectedSnapshots).toBe(3);
  });
});
