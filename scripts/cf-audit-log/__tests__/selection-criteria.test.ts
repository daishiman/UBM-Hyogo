import { describe, expect, it } from "vitest";
import {
  DEFAULT_CRITERIA,
  selectWinner,
  type ClassifierMetrics,
} from "../evaluation/selection-criteria.ts";

const baseline: ClassifierMetrics = {
  name: "threshold",
  version: "1.0.0",
  metrics: {
    precision: 0.8,
    recall: 0.85,
    fp: 10,
    fn: 5,
    fpRate: 0.01,
    fnRate: 0.005,
    fallbackRate: 0,
    latencyP50: 0.4,
    latencyP95: 1.2,
  },
};

function metric(
  name: string,
  precision: number,
  recall: number,
  fallbackRate: number,
  latencyP95: number,
): ClassifierMetrics {
  return {
    name,
    version: "1.0.0",
    metrics: {
      precision,
      recall,
      fp: 0,
      fn: 0,
      fpRate: 0,
      fnRate: 0,
      fallbackRate,
      latencyP50: 0,
      latencyP95,
    },
  };
}

describe("selectWinner", () => {
  it("rejects candidate when precision is below baseline + 5pt", () => {
    const result = selectWinner(
      [baseline, metric("isolation-forest", 0.83, 0.9, 0, 10)],
      baseline,
    );
    expect(result.winner).toBeNull();
    expect(result.rejected[0]?.reason).toContain("precision_below_baseline");
  });

  it("rejects candidate when fallback rate exceeds threshold", () => {
    const result = selectWinner(
      [baseline, metric("workers-ai", 0.9, 0.9, 0.5, 100)],
      baseline,
    );
    expect(result.winner).toBeNull();
    expect(result.rejected[0]?.reason).toContain("fallbackRate");
  });

  it("rejects candidate when latency p95 > 500ms", () => {
    const result = selectWinner(
      [baseline, metric("workers-ai", 0.9, 0.9, 0, 800)],
      baseline,
    );
    expect(result.winner).toBeNull();
    expect(result.rejected[0]?.reason).toContain("latencyP95");
  });

  it("prefers higher precision in tie-break", () => {
    const result = selectWinner(
      [
        baseline,
        metric("isolation-forest", 0.9, 0.9, 0, 10),
        metric("xgboost", 0.95, 0.9, 0, 20),
      ],
      baseline,
    );
    expect(result.winner).toBe("xgboost");
    expect(result.criteria).toEqual(DEFAULT_CRITERIA);
  });

  it("prefers lower latency when precision ties", () => {
    const result = selectWinner(
      [
        baseline,
        metric("isolation-forest", 0.9, 0.9, 0, 50),
        metric("xgboost", 0.9, 0.9, 0, 20),
      ],
      baseline,
    );
    expect(result.winner).toBe("xgboost");
  });
});
