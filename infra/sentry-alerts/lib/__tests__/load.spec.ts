import { describe, expect, it } from "vitest";
import path from "node:path";
import { loadExpected } from "../load.ts";

const REPO_ROOT = path.resolve(__dirname, "../../../..");

describe("loadExpected", () => {
  it("loads admin error boundary policy", () => {
    const policies = loadExpected(REPO_ROOT);
    expect(policies.map((policy) => policy.name)).toEqual(["admin-error-boundary"]);
    expect(policies[0]).toMatchObject({
      environment: "staging",
      frequency: { window_minutes: 5, threshold: 3 },
      notification_interval_minutes: 5,
    });
  });

  it("sorts filters into canonical order", () => {
    const [policy] = loadExpected(REPO_ROOT);
    expect(policy.filters).toEqual([
      { field: "event", value: "error.boundary.caught" },
      { field: "scope", value: "admin" },
    ]);
  });
});
