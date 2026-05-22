import { describe, expect, it } from "vitest";
import {
  IsolationForestClassifier,
  type IsolationForestArtifact,
} from "../classifier/isolation-forest.ts";
import type { AuditLogEvent, Baseline } from "../types.ts";

const baseline: Baseline = {
  successPerHourP95: 5,
  failurePerHourP95: 1,
  offHoursRatio: 0.1,
  computedAt: "2026-05-07T00:00:00Z",
  windowDays: 7,
};

const event: AuditLogEvent = {
  id: "e-1",
  when: "2026-05-07T05:00:00Z",
  actor: { email: "ci@example.com", ip: "203.0.113.5" },
  action: { type: "token.read", result: "success" },
};

const ctx = {
  githubIpRanges: ["140.82.112.0/20"],
  businessHoursJst: { start: 9, end: 19 },
  recentFailuresInHour: 0,
  rotationWindowMs: null,
};

describe("IsolationForestClassifier", () => {
  it("falls back to threshold when model artifact is missing", () => {
    const c = new IsolationForestClassifier(null);
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("isolation-forest");
    expect(result?.reason).toContain("isolation-forest-fallback-to-threshold");
    expect(result?.severity).toBe("HIGH");
  });

  it("falls back when path is invalid", () => {
    const c = new IsolationForestClassifier("/nonexistent/path/model.json");
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.reason).toContain("isolation-forest-fallback-to-threshold");
    expect(c.version).toBe("isolation-forest@fallback");
  });

  it("uses ML scoring when artifact is loaded", async () => {
    const fs = await import("node:fs");
    const os = await import("node:os");
    const path = await import("node:path");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "if-"));
    const modelPath = path.join(tmpDir, "model.json");
    const artifact: IsolationForestArtifact = {
      $schema: "isolation-forest-v1",
      name: "isolation-forest",
      version: "1.0.0",
      trainedAt: "2026-05-08T00:00:00Z",
      datasetHash: "test",
      params: { numTrees: 1, subSampleSize: 4, seed: 1 },
      trees: [
        {
          nodes: [
            { feature: "hour_of_day", threshold: 12, left: 1, right: 2 },
            { leaf: true, depth: 1 },
            { leaf: true, depth: 1 },
          ],
        },
      ],
      severityThresholds: { high: 0.0, medium: 0.0, low: 0.0 },
    };
    fs.writeFileSync(modelPath, JSON.stringify(artifact));
    const c = new IsolationForestClassifier(modelPath);
    expect(c.version).toBe("isolation-forest@1.0.0");
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("isolation-forest");
    expect(result?.reason).toContain("isolation-forest score");
  });
});
