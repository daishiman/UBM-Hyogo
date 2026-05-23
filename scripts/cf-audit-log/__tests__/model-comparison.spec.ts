import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  evaluateClassifier,
  renderMarkdown,
  runComparison,
  type LabeledEvent,
} from "../evaluation/model-comparison.ts";
import { ThresholdClassifier } from "../classifier/threshold.ts";

const fixtures: LabeledEvent[] = [
  {
    expectedSeverity: "HIGH",
    event: {
      id: "a-1",
      when: "2026-05-07T05:00:00Z",
      actor: { email: "ci@example.com", ip: "203.0.113.5" },
      action: { type: "token.read", result: "success" },
    },
  },
  {
    expectedSeverity: "NONE",
    event: {
      id: "n-1",
      when: "2026-05-07T05:00:00Z",
      actor: { email: "ci@example.com", ip: "140.82.115.10" },
      action: { type: "token.read", result: "success" },
    },
  },
];

describe("model-comparison", () => {
  it("evaluates a classifier and returns metrics block", () => {
    const result = evaluateClassifier(fixtures, new ThresholdClassifier());
    expect(result.name).toBe("threshold");
    expect(result.metrics.precision).toBeGreaterThan(0);
    expect(result.metrics.fallbackRate).toBe(0);
    expect(result.metrics.latencyP95).toBeGreaterThanOrEqual(0);
  });

  it("runs comparison across all 4 classifiers and produces a report", () => {
    const dir = mkdtempSync(join(tmpdir(), "cmp-"));
    const datasetPath = join(dir, "dataset.jsonl");
    writeFileSync(
      datasetPath,
      fixtures.map((r) => JSON.stringify(r)).join("\n"),
    );
    const report = runComparison({ datasetPath });
    expect(report.classifiers).toHaveLength(4);
    expect(report.classifiers.map((c) => c.name)).toEqual([
      "threshold",
      "isolation-forest",
      "xgboost",
      "workers-ai",
    ]);
    expect(
      report.classifiers.find((c) => c.name === "workers-ai")?.metrics.fallbackRate,
    ).toBe(1);
    const md = renderMarkdown(report);
    expect(md).toContain("# Model Comparison Report");
    expect(md).toContain("threshold");
  });
});
