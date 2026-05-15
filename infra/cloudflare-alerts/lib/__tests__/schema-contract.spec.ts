import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../../..");

function readJson<T = unknown>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf-8")) as T;
}

function listJson(relativeDir: string): Array<Record<string, unknown>> {
  return fs
    .readdirSync(path.join(REPO_ROOT, relativeDir))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson<Record<string, unknown>>(path.join(relativeDir, name)));
}

describe("cloudflare-alerts schema contract", () => {
  it("policy schema rejects zero percentage like runtime computeThreshold", () => {
    const schema = readJson<Record<string, unknown>>("infra/cloudflare-alerts/schema/policy.schema.json");
    const conditions = schema.properties as Record<string, unknown>;
    const conditionSchema = (conditions.conditions as Record<string, unknown>).oneOf as Array<Record<string, unknown>>;
    const leafPercentage = ((conditionSchema[0].properties as Record<string, unknown>).percentage as Record<string, unknown>);
    const anyOfPercentage = ((((conditionSchema[1].properties as Record<string, unknown>).anyOf as Record<string, unknown>).items as Record<string, unknown>).properties as Record<string, unknown>).percentage as Record<string, unknown>;

    expect(leafPercentage.exclusiveMinimum).toBe(0);
    expect(leafPercentage.minimum).toBeUndefined();
    expect(anyOfPercentage.exclusiveMinimum).toBe(0);
    expect(anyOfPercentage.minimum).toBeUndefined();
  });

  it("policy manifests do not contain server ids or absolute thresholds", () => {
    for (const policy of listJson("infra/cloudflare-alerts/policies")) {
      expect(policy.id).toBeUndefined();
      const conditions = policy.conditions as Record<string, unknown>;
      if (Array.isArray(conditions.anyOf)) {
        for (const leaf of conditions.anyOf as Array<Record<string, unknown>>) {
          expect(leaf.threshold).toBeUndefined();
          expect(typeof leaf.percentage).toBe("number");
        }
      } else {
        expect(conditions.threshold).toBeUndefined();
        expect(typeof conditions.percentage).toBe("number");
      }
    }
  });

  it("webhook manifests keep URL and secret as op refs only", () => {
    for (const webhook of listJson("infra/cloudflare-alerts/webhooks")) {
      expect(webhook.url).toBeUndefined();
      expect(webhook.secret).toBeUndefined();
      expect(String(webhook.urlRef)).toMatch(/^op:\/\//);
      const secretHeader = webhook.secretHeader as Record<string, unknown>;
      expect(String(secretHeader.valueRef)).toMatch(/^op:\/\//);
    }
  });
});
