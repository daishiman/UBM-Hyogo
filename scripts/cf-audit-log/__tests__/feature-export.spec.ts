import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { InMemoryD1, readEventsForFeatureExport } from "../d1-client.ts";
import { scanForSecrets } from "../evaluation/secret-leakage-grep.ts";
import { exportRedactedFeatureDataset, loadDb } from "../feature-export.ts";
import { sha256Hex } from "../feature-export/manifest.ts";
import { validateRedactedFeatureJsonl } from "../feature-export/schema-validation.ts";
import type { AuditLogEvent } from "../types.ts";

function event(overrides: Partial<AuditLogEvent> = {}): AuditLogEvent {
  return {
    id: "feature-1",
    when: "2026-05-07T15:30:00.000Z",
    actor: {
      email: "operator@example.com",
      ip: "203.0.113.77",
      user_agent: "Mozilla/5.0 Chrome/123",
    },
    action: { type: "token.read", result: "failure", result_code: 403 },
    resource: { type: "api_token", id: "tok_123" },
    ...overrides,
  };
}

function tempPaths(): { dir: string; outPath: string; manifestPath: string } {
  const dir = mkdtempSync(join(tmpdir(), "cf-audit-feature-export-"));
  return {
    dir,
    outPath: join(dir, "features.jsonl"),
    manifestPath: join(dir, "manifest.json"),
  };
}

describe("feature export", () => {
  it("exports redacted JSONL and manifest from a window", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      const db = InMemoryD1.fromEvents([
        event(),
        event({ id: "outside", when: "2026-01-01T00:00:00.000Z" }),
      ]);
      const manifest = await exportRedactedFeatureDataset({
        db,
        window: {
          fromUtc: new Date("2026-05-01T00:00:00.000Z"),
          toUtc: new Date("2026-05-09T00:00:00.000Z"),
        },
        redactSecret: "local-redaction-secret",
        outPath,
        manifestPath,
        now: () => new Date("2026-05-08T01:02:03.000Z"),
        exportRunId: "run-1",
      });

      const jsonl = readFileSync(outPath, "utf8");
      const lines = validateRedactedFeatureJsonl(jsonl);
      expect(lines).toHaveLength(1);
      expect(lines[0]!.id).toBe("feature-1");
      expect(lines[0]!.features.ipBucket).toBe("203.0.113.0/24");
      expect(jsonl).not.toContain("operator@example.com");
      expect(jsonl).not.toContain("203.0.113.77");
      expect(jsonl).not.toContain("Mozilla/5.0");
      expect(scanForSecrets(outPath).hits).toEqual([]);

      expect(manifest).toMatchObject({
        exportRunId: "run-1",
        source: "cf_audit_log",
        rowCount: 1,
        redactionPolicyVersion: "feature-v1",
        schemaVersion: "redacted-features-v1",
      });
      expect(manifest.sha256).toBe(sha256Hex(jsonl));
      expect(JSON.parse(readFileSync(manifestPath, "utf8")).sha256).toBe(manifest.sha256);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails closed without a redaction secret", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      await expect(
        exportRedactedFeatureDataset({
          db: InMemoryD1.fromEvents([event()]),
          window: {
            fromUtc: new Date("2026-05-01T00:00:00.000Z"),
            toUtc: new Date("2026-05-09T00:00:00.000Z"),
          },
          redactSecret: "",
          outPath,
          manifestPath,
        }),
      ).rejects.toThrow(/redaction secret/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("produces a valid empty JSONL and manifest for empty windows", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      const manifest = await exportRedactedFeatureDataset({
        db: InMemoryD1.fromEvents([]),
        window: {
          fromUtc: new Date("2026-05-01T00:00:00.000Z"),
          toUtc: new Date("2026-05-09T00:00:00.000Z"),
        },
        redactSecret: "local-redaction-secret",
        outPath,
        manifestPath,
        exportRunId: "empty-run",
      });

      const jsonl = readFileSync(outPath, "utf8");
      expect(jsonl).toBe("");
      expect(validateRedactedFeatureJsonl(jsonl)).toEqual([]);
      expect(manifest.rowCount).toBe(0);
      expect(manifest.sha256).toBe(sha256Hex(""));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not publish final paths when a redaction guard fails", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      await expect(
        exportRedactedFeatureDataset({
          db: InMemoryD1.fromEvents([
            event({ id: "operator@example.com" }),
          ]),
          window: {
            fromUtc: new Date("2026-05-01T00:00:00.000Z"),
            toUtc: new Date("2026-05-09T00:00:00.000Z"),
          },
          redactSecret: "local-redaction-secret",
          outPath,
          manifestPath,
        }),
      ).rejects.toThrow(/redaction violation/);
      expect(existsSync(outPath)).toBe(false);
      expect(existsSync(manifestPath)).toBe(false);
      expect(existsSync(`${outPath}.tmp`)).toBe(false);
      expect(existsSync(`${manifestPath}.tmp`)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects invalid windows and malformed schema lines", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      await expect(
        exportRedactedFeatureDataset({
          db: InMemoryD1.fromEvents([event()]),
          window: {
            fromUtc: new Date("2026-05-09T00:00:00.000Z"),
            toUtc: new Date("2026-05-01T00:00:00.000Z"),
          },
          redactSecret: "local-redaction-secret",
          outPath,
          manifestPath,
        }),
      ).rejects.toThrow(/invalid feature export window/);

      expect(() =>
        validateRedactedFeatureJsonl(
          '{"id":"x","occurredAt":"2026-05-07T00:00:00.000Z","features":{"hourOfDay":99}}\n',
        )
      ).toThrow(/schema error/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("validates object inputs and reads feature rows without raw_json dependency", async () => {
    const db = InMemoryD1.fromEvents([
      event({ id: "b", when: "2026-05-07T15:31:00.000Z" }),
      event({ id: "a", when: "2026-05-07T15:30:00.000Z" }),
    ]);
    const events = await readEventsForFeatureExport(db, {
      fromUtc: new Date("2026-05-01T00:00:00.000Z"),
      toUtc: new Date("2026-05-09T00:00:00.000Z"),
    });
    expect(events.map((e) => e.id)).toEqual(["a", "b"]);

    const line = validateRedactedFeatureJsonl(
      JSON.stringify({
        id: "object-1",
        occurredAt: "2026-05-07T00:00:00.000Z",
        features: {
          ipBucket: "unknown",
          hourOfDay: 0,
          dayOfWeek: 4,
          actionCategory: "other",
          statusClass: "unknown",
          actorRoleHash: "0123456789abcdef",
          userAgentCategory: "unknown",
          tokenIdPresent: false,
        },
      }),
    )[0];
    expect(line?.id).toBe("object-1");
  });

  it("keeps positive leakage fixtures detectable", () => {
    expect(
      scanForSecrets("tests/fixtures/cf-audit/leakage-positive-ip.jsonl").hits,
    ).not.toEqual([]);
  });

  it("allows UUID audit ids while keeping token-like values detectable", async () => {
    const { dir, outPath, manifestPath } = tempPaths();
    try {
      await exportRedactedFeatureDataset({
        db: InMemoryD1.fromEvents([
          event({ id: "b7355415-5ec2-4c5b-aea1-d77ca37395d4" }),
        ]),
        window: {
          fromUtc: new Date("2026-05-01T00:00:00.000Z"),
          toUtc: new Date("2026-05-09T00:00:00.000Z"),
        },
        redactSecret: "local-redaction-secret",
        outPath,
        manifestPath,
      });
      expect(scanForSecrets(outPath).hits).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("requires an explicit confirmation flag before constructing a production D1 backend", () => {
    expect(() => loadDb({})).toThrow(/confirm-production-export/);
    expect(() => loadDb({ "confirm-production-export": true })).not.toThrow();
    expect(() => loadDb({ env: "staging" })).not.toThrow();
  });
});
