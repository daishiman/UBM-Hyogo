import { describe, expect, it } from "vitest";
import {
  XGBoostClassifier,
  type XGBoostArtifact,
} from "../classifier/xgboost.ts";
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

describe("XGBoostClassifier", () => {
  it("falls back to threshold when model artifact is missing", () => {
    const c = new XGBoostClassifier(null);
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("xgboost");
    expect(result?.reason).toContain("xgboost-fallback-to-threshold");
  });

  it("uses xgboost scoring when artifact is loaded", async () => {
    const fs = await import("node:fs");
    const os = await import("node:os");
    const path = await import("node:path");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "xgb-"));
    const modelPath = path.join(tmpDir, "model.json");
    const artifact: XGBoostArtifact = {
      $schema: "xgboost-v1",
      name: "xgboost",
      version: "1.0.0",
      trainedAt: "2026-05-08T00:00:00Z",
      datasetHash: "t",
      params: { numRounds: 1, maxDepth: 2, learningRate: 1, seed: 1 },
      baseScore: 5,
      boosters: [
        {
          tree: [
            {
              nodeId: 0,
              feature: "hour_of_day",
              split: 1,
              yes: 1,
              no: 2,
              missing: 1,
            },
            { nodeId: 1, leaf: 0 },
            { nodeId: 2, leaf: 0 },
          ],
        },
      ],
      severityThresholds: { high: 0.5, medium: 0.3, low: 0.1 },
    };
    fs.writeFileSync(modelPath, JSON.stringify(artifact));
    const c = new XGBoostClassifier(modelPath);
    expect(c.version).toBe("xgboost@1.0.0");
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("xgboost");
    expect(result?.reason).toContain("xgboost score");
    expect(result?.severity).toBe("HIGH"); // sigmoid(5) ~= 0.99
  });
});
