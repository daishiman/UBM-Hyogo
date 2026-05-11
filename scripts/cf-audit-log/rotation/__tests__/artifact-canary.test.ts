import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDefaultCanaryDeps,
  exitCodeFor,
  runArtifactCanary,
  type ArtifactCanaryDeps,
} from "../artifact-canary.ts";
import type { CanaryMetrics } from "../types.ts";

const CANDIDATE = "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE";
const BASELINE = "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD";
// A synthetic non-op-ref string used only to assert the canary refuses
// non-op-reference inputs. Intentionally not a real path scheme so that
// repository-wide AC-6 grep gates do not flag this fixture.
const NON_OP_REF_INPUT = "synthetic-non-op-ref-input";

const goodMetrics: CanaryMetrics = {
  precisionProxy: 0.92,
  recallProxy: 0.88,
  fallbackRate: 0.01,
  p95LatencyMs: 90,
  leakageHits: 0,
};

const baseMetrics: CanaryMetrics = {
  precisionProxy: 0.9,
  recallProxy: 0.85,
  fallbackRate: 0.02,
  p95LatencyMs: 100,
  leakageHits: 0,
};

function tmpOut(): string {
  return join(mkdtempSync(join(tmpdir(), "artifact-canary-")), "out.json");
}

function makeDeps(overrides: Partial<ArtifactCanaryDeps> = {}): {
  deps: ArtifactCanaryDeps;
  logs: string[];
} {
  const logs: string[] = [];
  const deps: ArtifactCanaryDeps = {
    loadArtifact: async (ref) => ({
      classifierVersion: ref === CANDIDATE ? "ml@v1.1.0" : "ml@v1.0.0",
    }),
    replay: async (artifact) => ({
      totalEventsReplayed: 50,
      metrics: artifact.classifierVersion === "ml@v1.1.0" ? goodMetrics : baseMetrics,
    }),
    scanLeakage: async () => ({ hits: 0 }),
    log: (line) => logs.push(line),
    ...overrides,
  };
  return { deps, logs };
}

describe("artifact-canary", () => {
  it("A1: candidate beats baseline -> verdict candidate_pass", async () => {
    const out = tmpOut();
    const { deps } = makeDeps();
    const r = await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    expect(r.verdict).toBe("candidate_pass");
    expect(exitCodeFor(r.verdict, true)).toBe(0);
    const onDisk = JSON.parse(readFileSync(out, "utf8"));
    expect(onDisk.candidate.precisionProxy).toBeGreaterThanOrEqual(
      onDisk.baseline.precisionProxy,
    );
  });

  it("A2: candidate load throws -> verdict candidate_fail_load + exit 1", async () => {
    const out = tmpOut();
    const { deps } = makeDeps({
      loadArtifact: async () => {
        throw new Error(`load failed for ${NON_OP_REF_INPUT}`);
      },
    });
    const r = await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    expect(r.verdict).toBe("candidate_fail_load");
    expect(exitCodeFor(r.verdict, true)).toBe(1);
  });

  it("A3: leakage hits > 0 -> verdict candidate_fail_leakage + exit 1", async () => {
    const out = tmpOut();
    const { deps } = makeDeps({ scanLeakage: async () => ({ hits: 2 }) });
    const r = await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    expect(r.verdict).toBe("candidate_fail_leakage");
    expect(r.candidate.leakageHits).toBe(2);
    expect(exitCodeFor(r.verdict, true)).toBe(1);
  });

  it("A4: candidate metrics worse than baseline -> candidate_fail_metrics", async () => {
    const out = tmpOut();
    const { deps } = makeDeps({
      replay: async (artifact) => ({
        totalEventsReplayed: 50,
        metrics:
          artifact.classifierVersion === "ml@v1.1.0"
            ? { ...baseMetrics, precisionProxy: 0.5 }
            : baseMetrics,
      }),
    });
    const r = await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    expect(r.verdict).toBe("candidate_fail_metrics");
    expect(exitCodeFor(r.verdict, true)).toBe(1);
  });

  it("A5: --no-exit-on-leakage maps fail_leakage to exit 0", async () => {
    expect(exitCodeFor("candidate_fail_leakage", false)).toBe(0);
    expect(exitCodeFor("candidate_fail_leakage", true)).toBe(1);
  });

  it("A6: log lines never contain raw op-ref values", async () => {
    const out = tmpOut();
    const { deps, logs } = makeDeps();
    await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    for (const line of logs) {
      expect(line).not.toContain(CANDIDATE);
      expect(line).not.toContain(BASELINE);
    }
  });

  it("A7: error stack messages redact resolved values that match the op refs", async () => {
    const out = tmpOut();
    const { deps, logs } = makeDeps({
      loadArtifact: async () => {
        throw new Error(`failed to fetch ${CANDIDATE}`);
      },
    });
    await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    const joined = logs.join("\n");
    expect(joined).not.toContain(CANDIDATE);
    expect(joined).toContain("<redacted-op-ref>");
  });

  it("A8: writes JSON conforming to schema", async () => {
    const out = tmpOut();
    const { deps } = makeDeps();
    await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      deps,
    );
    const onDisk = JSON.parse(readFileSync(out, "utf8"));
    for (const k of [
      "canaryRunId",
      "candidatePathRef",
      "baselinePathRef",
      "candidateClassifierVersion",
      "baselineClassifierVersion",
      "replayWindowHours",
      "totalEventsReplayed",
      "candidate",
      "baseline",
      "verdict",
    ]) {
      expect(onDisk).toHaveProperty(k);
    }
    for (const k of [
      "precisionProxy",
      "recallProxy",
      "fallbackRate",
      "p95LatencyMs",
      "leakageHits",
    ]) {
      expect(onDisk.candidate).toHaveProperty(k);
      expect(onDisk.baseline).toHaveProperty(k);
    }
  });

  it("rejects non-op-ref input for candidate or baseline", async () => {
    await expect(
      runArtifactCanary(
        { candidate: NON_OP_REF_INPUT, baseline: BASELINE, out: tmpOut() },
        makeDeps().deps,
      ),
    ).rejects.toThrow(/op reference/);
  });

  it("A9: default CLI dependencies run offline replay without injected fakes", async () => {
    const out = tmpOut();
    const r = await runArtifactCanary(
      { candidate: CANDIDATE, baseline: BASELINE, out },
      createDefaultCanaryDeps(),
    );
    expect(r.totalEventsReplayed).toBeGreaterThan(0);
    expect(["candidate_pass", "candidate_fail_metrics"]).toContain(r.verdict);
    expect(JSON.parse(readFileSync(out, "utf8")).candidatePathRef).toBe(CANDIDATE);
  });
});
