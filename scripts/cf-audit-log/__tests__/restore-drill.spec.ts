import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { restoreDrill } from "../restore-drill.ts";
import type { D1Like, ManifestStore } from "../manifest-store.ts";
import type { R2Client } from "../r2-client.ts";
import type { ExportManifestRow } from "../types.ts";

function makeManifest(rows: ExportManifestRow[]): ManifestStore {
  return {
    async insertPending() {},
    async markCompleted() {},
    async markFailed() {},
    async findByPartition() {
      return null;
    },
    async listForRandomPick(limit) {
      return rows.slice(0, limit);
    },
  };
}

function makeManifestRow(opts: Partial<ExportManifestRow> = {}): ExportManifestRow {
  return {
    id: "row-1",
    exportRunId: "run-1",
    yyyy: 2026,
    mm: 4,
    dd: 8,
    objectKey: "audit/v1/yyyy=2026/mm=04/dd=08/cf-audit-log-20260408.jsonl.gz",
    rowCount: 2,
    uncompressedBytes: 0,
    compressedBytes: 0,
    sha256: "",
    r2Etag: "etag-1",
    redactionPolicyVersion: "v1",
    status: "completed",
    startedAt: "2026-04-09T00:00:00Z",
    completedAt: "2026-04-09T00:01:00Z",
    errorMessage: null,
    ...opts,
  };
}

function makeR2WithJsonl(jsonl: string): R2Client {
  const gz = gzipSync(Buffer.from(jsonl, "utf8"));
  return {
    async putObject() {
      return { etag: "x" };
    },
    async getObject() {
      return { body: new Uint8Array(gz), metadata: {} };
    },
    async listObjects() {
      return [];
    },
  };
}

function makeMemDb(): D1Like {
  const tables = new Map<string, Map<string, string>>();
  let currentTable = "";
  let currentOp = "";
  let bound: unknown[] = [];
  return {
    prepare(sql: string) {
      const api = {
        bind(...vals: unknown[]) {
          bound = vals;
          return api;
        },
        async run() {
          if (sql.startsWith("DROP TABLE")) {
            const m = sql.match(/DROP TABLE IF EXISTS (\w+)/);
            if (m) tables.delete(m[1]!);
          } else if (sql.startsWith("CREATE TABLE")) {
            const m = sql.match(/CREATE TABLE (\w+)/);
            if (m) tables.set(m[1]!, new Map());
          } else if (sql.startsWith("INSERT")) {
            const m = sql.match(/INTO (\w+)/);
            const t = m ? tables.get(m[1]!) : undefined;
            if (t) t.set(String(bound[0]), String(bound[1]));
          }
          return undefined;
        },
        async first() {
          if (sql.includes("COUNT(*)")) {
            const m = sql.match(/FROM (\w+)/);
            const t = m ? tables.get(m[1]!) : undefined;
            return { c: t?.size ?? 0 } as never;
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
      return api as never;
    },
  };
}

describe("restoreDrill", () => {
  it("skips outside semiannual months without forceRun", async () => {
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(""),
        manifest: makeManifest([]),
        reportIssue: async () => {},
        now: () => new Date("2026-05-07T00:00:00Z"),
      },
    );
    expect(r.skipped).toBe("non-semiannual");
    expect(r.ok).toBe(true);
  });

  it("runs in January (semiannual)", async () => {
    const jsonl = JSON.stringify({ id: "a" }) + "\n" + JSON.stringify({ id: "b" }) + "\n";
    const sha = createHash("sha256").update(jsonl).digest("hex");
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(jsonl),
        manifest: makeManifest([makeManifestRow({ rowCount: 2, sha256: sha })]),
        reportIssue: async () => {},
        now: () => new Date("2026-01-15T00:00:00Z"),
      },
    );
    expect(r.skipped).toBeUndefined();
    expect(r.ok).toBe(true);
    expect(r.drilled[0]!.actualRowCount).toBe(2);
    expect(r.drilled[0]!.sha256Match).toBe(true);
  });

  it("forceRun bypasses semiannual gate", async () => {
    const jsonl = JSON.stringify({ id: "a" }) + "\n";
    const sha = createHash("sha256").update(jsonl).digest("hex");
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(jsonl),
        manifest: makeManifest([makeManifestRow({ rowCount: 1, sha256: sha })]),
        reportIssue: async () => {},
        now: () => new Date("2026-05-07T00:00:00Z"),
      },
      { forceRun: true },
    );
    expect(r.skipped).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it("detects sha256 mismatch as ok=false", async () => {
    const jsonl = JSON.stringify({ id: "a" }) + "\n";
    const reportIssue = vi.fn(async () => {});
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(jsonl),
        manifest: makeManifest([makeManifestRow({ rowCount: 1, sha256: "WRONG_HASH" })]),
        reportIssue,
        now: () => new Date("2026-07-01T00:00:00Z"),
      },
    );
    expect(r.ok).toBe(false);
    expect(reportIssue).toHaveBeenCalled();
  });

  it("detects row count mismatch as ok=false", async () => {
    const jsonl = JSON.stringify({ id: "a" }) + "\n";
    const sha = createHash("sha256").update(jsonl).digest("hex");
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(jsonl),
        manifest: makeManifest([makeManifestRow({ rowCount: 99, sha256: sha })]),
        reportIssue: async () => {},
        now: () => new Date("2026-07-01T00:00:00Z"),
      },
    );
    expect(r.ok).toBe(false);
  });

  it("returns ok=true when no completed manifests exist", async () => {
    const r = await restoreDrill(
      {
        db: makeMemDb(),
        r2: makeR2WithJsonl(""),
        manifest: makeManifest([]),
        reportIssue: async () => {},
        now: () => new Date("2026-07-01T00:00:00Z"),
      },
    );
    expect(r.ok).toBe(true);
    expect(r.drilled).toHaveLength(0);
  });
});
