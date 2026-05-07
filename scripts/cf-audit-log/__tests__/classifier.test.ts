import { describe, expect, it } from "vitest";
import { getClassifier } from "../classifier/index.ts";
import { ThresholdClassifier } from "../classifier/threshold.ts";
import { MLClassifier } from "../classifier/ml.ts";
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

const input = {
  event,
  baseline,
  context: {
    githubIpRanges: ["140.82.112.0/20"],
    businessHoursJst: { start: 9, end: 19 },
    recentFailuresInHour: 0,
    rotationWindowMs: null,
  },
};

describe("cf-audit-log classifier abstraction", () => {
  it("wraps the threshold classifier without changing severity", () => {
    const result = new ThresholdClassifier().classify(input);
    expect(result?.severity).toBe("HIGH");
    expect(result?.classifierUsed).toBe("threshold");
    expect(result?.confidence).toBe(1);
  });

  it("returns threshold by default", () => {
    expect(getClassifier({})).toBeInstanceOf(ThresholdClassifier);
    expect(getClassifier({ CF_AUDIT_CLASSIFIER: "threshold" })).toBeInstanceOf(
      ThresholdClassifier,
    );
  });

  it("returns ML skeleton with threshold fallback when requested", () => {
    const classifier = getClassifier({ CF_AUDIT_CLASSIFIER: "ml" });
    expect(classifier).toBeInstanceOf(MLClassifier);
    const result = classifier.classify(input);
    expect(result?.severity).toBe("HIGH");
    expect(result?.classifierUsed).toBe("ml");
    expect(result?.classifierVersion).toBe("ml@v0.0.0-skeleton-fallback");
    expect(result?.reason).toContain("ml-fallback-to-threshold");
  });
});
