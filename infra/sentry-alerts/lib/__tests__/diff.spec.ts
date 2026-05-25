import { describe, expect, it } from "vitest";
import { diffPolicy } from "../diff.ts";
import type { CanonicalSentryPolicy } from "../types.ts";

function policy(name = "admin-error-boundary"): CanonicalSentryPolicy {
  return {
    name,
    description: "Admin scope error.boundary.caught regression detection",
    environment: "staging",
    action_match: "all",
    filter_match: "all",
    filters: [
      { field: "event", value: "error.boundary.caught" },
      { field: "scope", value: "admin" },
    ],
    frequency: { window_minutes: 5, threshold: 3 },
    actions: [
      {
        type: "slack",
        target: "#ubm-hyogo-incidents",
        workspace_id_env: "SENTRY_SLACK_WORKSPACE_ID",
        tags: ["digest", "environment", "event", "scope"],
      },
    ],
    notification_interval_minutes: 5,
  };
}

describe("diffPolicy", () => {
  it("returns empty when policies match", () => {
    expect(diffPolicy([policy()], [policy()])).toEqual([]);
  });

  it("detects missing and extra rules", () => {
    expect(diffPolicy([policy()], [])).toEqual([{ kind: "missing", name: "admin-error-boundary" }]);
    expect(diffPolicy([], [policy("legacy-rule")])).toEqual([{ kind: "extra", name: "legacy-rule" }]);
  });

  it("detects changed threshold", () => {
    const actual = policy();
    actual.frequency.threshold = 4;
    expect(diffPolicy([policy()], [actual])).toEqual([
      {
        kind: "changed",
        name: "admin-error-boundary",
        path: "frequency.threshold",
        expected: 3,
        actual: 4,
      },
    ]);
  });
});
