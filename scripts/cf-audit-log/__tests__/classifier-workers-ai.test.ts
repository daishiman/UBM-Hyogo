import { describe, expect, it, vi } from "vitest";
import { WorkersAIClassifier } from "../classifier/workers-ai.ts";
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

describe("WorkersAIClassifier", () => {
  it("falls back to threshold when config is missing", () => {
    const c = new WorkersAIClassifier(null, null);
    const result = c.classify({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("workers-ai");
    expect(result?.reason).toContain("config-missing");
  });

  it("uses anomaly score from gateway in async path", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ anomalyScore: 0.9 }), { status: 200 }),
      );
    const c = new WorkersAIClassifier("https://gw.example/score", "tok", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await c.classifyAsync({ event, baseline, context: ctx });
    expect(result?.classifierUsed).toBe("workers-ai");
    expect(result?.severity).toBe("HIGH");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("falls back when gateway errors", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("quota exceeded"));
    const c = new WorkersAIClassifier("https://gw.example/score", "tok", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await c.classifyAsync({ event, baseline, context: ctx });
    expect(result?.reason).toContain("workers-ai-fallback");
  });
});
