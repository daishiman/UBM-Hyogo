import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectRotationEvidence,
  decideRotation,
  evaluateGates,
} from "../rotation-evidence-collector.ts";
import type { CanaryMetrics, CanaryOutput } from "../types.ts";

const baselineMetrics: CanaryMetrics = {
  precisionProxy: 0.9,
  recallProxy: 0.85,
  fallbackRate: 0.02,
  p95LatencyMs: 100,
  leakageHits: 0,
};

function makeCanary(overrides: Partial<CanaryMetrics> = {}, opts: Partial<CanaryOutput> = {}): CanaryOutput {
  return {
    canaryRunId: "canary-test",
    candidatePathRef: "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE",
    baselinePathRef: "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD",
    candidateClassifierVersion: "ml@v1.1.0",
    baselineClassifierVersion: "ml@v1.0.0",
    replayWindowHours: 1,
    totalEventsReplayed: 50,
    candidate: { ...baselineMetrics, ...overrides },
    baseline: { ...baselineMetrics },
    verdict: "candidate_pass",
    ...opts,
  };
}

function tmp(): string {
  return mkdtempSync(join(tmpdir(), "rotation-collector-"));
}

function writeCanary(canary: CanaryOutput, dir: string): string {
  const p = join(dir, "canary-out.json");
  writeFileSync(p, JSON.stringify(canary), "utf8");
  return p;
}

describe("rotation-evidence-collector", () => {
  it("C1: writes rotation-evidence.json with required fields and phase=canary", async () => {
    const dir = tmp();
    const canaryPath = writeCanary(makeCanary(), dir);
    const result = join(dir, "rotation-evidence.json");
    const ev = await collectRotationEvidence({ canaryOut: canaryPath, result });
    expect(ev.phase).toBe("canary");
    expect(ev.canary.candidate.precisionProxy).toBe(0.9);
    expect(ev.rawDatasetIncluded).toBe(false);
    const onDisk = JSON.parse(readFileSync(result, "utf8"));
    expect(onDisk.gate.R3_runbookApprovalPath).toContain("ml-model-artifact-rotation.md");
    expect(onDisk.gate.R3_rollbackApprovalReady).toBe(false);
  });

  it("C2: candidate precision below baseline -> R1 fail and discarded", () => {
    const canary = makeCanary({ precisionProxy: 0.7 });
    const gate = evaluateGates(canary);
    expect(gate.R1_replayPass).toBe(false);
    expect(decideRotation(canary, gate, "canary")).toBe("candidate_discarded");
  });

  it("C3: fallbackRate >= 0.05 -> R2 fail", () => {
    const canary = makeCanary({ fallbackRate: 0.1 });
    const gate = evaluateGates(canary);
    expect(gate.R2_latencyAndFallbackPass).toBe(false);
  });

  it("C4: p95 > baseline*1.5 -> R2 fail", () => {
    const canary = makeCanary({ p95LatencyMs: 200 });
    const gate = evaluateGates(canary);
    expect(gate.R2_latencyAndFallbackPass).toBe(false);
  });

  it("C5: leakageHits > 0 -> discarded", () => {
    const canary = makeCanary({ leakageHits: 3 }, { verdict: "candidate_fail_leakage" });
    const gate = evaluateGates(canary);
    expect(decideRotation(canary, gate, "canary")).toBe("candidate_discarded");
  });

  it("C6: R1/R2 pass but R3 missing -> discarded", () => {
    const canary = makeCanary();
    const gate = evaluateGates(canary);
    expect(gate.R1_replayPass).toBe(true);
    expect(gate.R2_latencyAndFallbackPass).toBe(true);
    expect(gate.R3_rollbackApprovalReady).toBe(false);
    expect(decideRotation(canary, gate, "canary")).toBe("candidate_discarded");
  });

  it("C6b: all gates including R3 pass -> promotion_pr_pending", () => {
    const canary = makeCanary();
    const gate = evaluateGates(canary, {
      previousArtifactRefRecorded: true,
      rollbackOwnerRecorded: true,
    });
    expect(gate.R3_rollbackApprovalReady).toBe(true);
    expect(decideRotation(canary, gate, "canary")).toBe("promotion_pr_pending");
  });

  it("C7: rotationId is auto-generated when omitted", async () => {
    const dir = tmp();
    const canaryPath = writeCanary(makeCanary(), dir);
    const result = join(dir, "ev.json");
    const ev = await collectRotationEvidence({ canaryOut: canaryPath, result });
    expect(ev.rotationId).toMatch(/^rot-/);
  });

  it("C8: write to invalid path throws", async () => {
    const dir = tmp();
    const canaryPath = writeCanary(makeCanary(), dir);
    await expect(
      collectRotationEvidence({
        canaryOut: canaryPath,
        result: "/nonexistent-dir-xyz-587/ev.json",
      }),
    ).rejects.toThrow();
  });
});
