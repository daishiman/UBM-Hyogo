import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../../..");

function readJson<T = unknown>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf-8")) as T;
}

describe("sentry-alerts schema contract", () => {
  it("admin manifest satisfies required issue-alert schema fields", () => {
    const schema = readJson<Record<string, unknown>>("infra/sentry-alerts/schema/policy.schema.json");
    const policy = readJson<Record<string, unknown>>(
      "infra/sentry-alerts/policies/admin-error-boundary.json",
    );
    for (const key of schema.required as string[]) {
      expect(policy, `missing required key: ${key}`).toHaveProperty(key);
    }
    const actions = policy.actions as Array<Record<string, unknown>>;
    expect(actions[0]).toMatchObject({
      type: "slack",
      target: "#ubm-hyogo-incidents",
      workspace_id_env: "SENTRY_SLACK_WORKSPACE_ID",
    });
    expect(actions[0]?.tags).toEqual(["environment", "event", "scope", "digest"]);
  });

  it("allows only known tag filter fields", () => {
    const schema = readJson<Record<string, unknown>>("infra/sentry-alerts/schema/policy.schema.json");
    const filters = ((schema.properties as Record<string, unknown>).filters as Record<string, unknown>);
    const item = filters.items as Record<string, unknown>;
    const properties = item.properties as Record<string, unknown>;
    const field = properties.field as Record<string, unknown>;
    expect(field.enum).toEqual(["event", "scope", "runtime", "digest"]);
    expect(item.additionalProperties).toBe(false);
  });

  it("requires issue-alert frequency window, threshold, and notification interval", () => {
    const schema = readJson<Record<string, unknown>>("infra/sentry-alerts/schema/policy.schema.json");
    const frequency = ((schema.properties as Record<string, unknown>).frequency as Record<string, unknown>);
    expect(frequency.required).toEqual(["window_minutes", "threshold"]);
    expect(frequency.additionalProperties).toBe(false);
    expect(schema.required).toContain("notification_interval_minutes");
  });

  it("policy manifests do not contain server ids or secret values", () => {
    const policy = readJson<Record<string, unknown>>(
      "infra/sentry-alerts/policies/admin-error-boundary.json",
    );
    expect(policy.id).toBeUndefined();
    expect(JSON.stringify(policy)).not.toMatch(/token|dsn|secret|https:\/\/hooks\.slack/i);
  });
});
