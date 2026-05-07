import { describe, expect, it, vi } from "vitest";
import { exportToR2 } from "../export-to-r2.ts";
import type { D1Like, ManifestStore } from "../manifest-store.ts";
import type { R2Client } from "../r2-client.ts";
import type { ExportManifestRow } from "../types.ts";

type Row = {
  id: string;
  occurred_at: string;
  occurred_at_ms: number;
  actor_email?: string;
  actor_ip?: string;
  actor_ua?: string;
  resource_id?: string;
  raw_json: string;
};

function makeDb(rowsByDay: Record<string, Row[]>): D1Like {
  return {
    prepare(sql: string) {
      expect(sql).toContain("occurred_at");
      expect(sql).not.toContain("captured_at");
      let bound: unknown[] = [];
      const api = {
        bind(...vals: unknown[]) {
          bound = vals;
          return api;
        },
        async run() {
          return undefined;
        },
        async first() {
          return null;
        },
        async all() {
          const start = bound[0] as string;
          const day = start.slice(0, 10);
          return { results: rowsByDay[day] ?? [] };
        },
      };
      return api as never;
    },
  };
}

function makeManifest(): ManifestStore & { state: Map<string, ExportManifestRow> } {
  const state = new Map<string, ExportManifestRow>();
  const partKey = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    state,
    async insertPending(row) {
      state.set(partKey(row.yyyy, row.mm, row.dd), {
        ...row,
        r2Etag: null,
        redactionPolicyVersion: "v1",
        status: "pending",
        completedAt: null,
        errorMessage: null,
      });
    },
    async markCompleted(id, completedAt, r2Etag = null) {
      for (const [k, v] of state) {
        if (v.id === id) state.set(k, { ...v, status: "completed", completedAt, r2Etag });
      }
    },
    async markFailed(id, completedAt, errorMessage) {
      for (const [k, v] of state) {
        if (v.id === id) {
          state.set(k, { ...v, status: "failed", completedAt, errorMessage });
        }
      }
    },
    async findByPartition(y, m, d) {
      return state.get(partKey(y, m, d)) ?? null;
    },
    async listForRandomPick(limit) {
      return [...state.values()].filter((r) => r.status === "completed").slice(0, limit);
    },
  };
}

function makeR2(): R2Client & { puts: Array<{ key: string; size: number }> } {
  const puts: Array<{ key: string; size: number }> = [];
  return {
    puts,
    async putObject(key, body) {
      puts.push({ key, size: body.byteLength });
      return { etag: "etag-" + key };
    },
    async getObject() {
      throw new Error("not used");
    },
    async listObjects() {
      return [];
    },
  };
}

const goodRow: Row = {
  id: "evt1",
  occurred_at: "2026-04-08T10:00:00Z",
  occurred_at_ms: Date.parse("2026-04-08T10:00:00Z"),
  actor_email: "admin@example.com",
  actor_ip: "203.0.113.42",
  actor_ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
  raw_json: JSON.stringify({
    actor: {
      email: "admin@example.com",
      ip: "203.0.113.42",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    },
    note: "raw json is not exported to R2",
  }),
};

describe("exportToR2", () => {
  it("dry-run does not call R2 PUT", async () => {
    const db = makeDb({ "2026-04-08": [goodRow] });
    const manifest = makeManifest();
    const r2 = makeR2();
    const result = await exportToR2(
      {
        db,
        r2,
        manifest,
        reportIssue: async () => {},
        now: () => new Date("2026-05-07T00:00:00Z"),
      },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
        dryRun: true,
      },
    );
    expect(r2.puts).toHaveLength(0);
    expect(result.manifests).toHaveLength(1);
    expect(result.totalRowCount).toBe(1);
  });

  it("non-dry-run writes manifest pending then completed and PUTs object", async () => {
    const db = makeDb({ "2026-04-08": [goodRow] });
    const manifest = makeManifest();
    const r2 = makeR2();
    const res = await exportToR2(
      { db, r2, manifest, reportIssue: async () => {} },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
      },
    );
    expect(r2.puts).toHaveLength(1);
    expect(res.failedPartitions).toHaveLength(0);
    const mfst = [...manifest.state.values()][0]!;
    expect(mfst.status).toBe("completed");
    expect(mfst.r2Etag).toBe("etag-" + r2.puts[0]!.key);
  });

  it("skips already-completed partitions (idempotent)", async () => {
    const db = makeDb({ "2026-04-08": [goodRow] });
    const manifest = makeManifest();
    manifest.state.set("2026-04-08", {
      id: "preexisting",
      exportRunId: "old",
      yyyy: 2026,
      mm: 4,
      dd: 8,
      objectKey: "old-key",
      rowCount: 1,
      uncompressedBytes: 0,
      compressedBytes: 0,
      sha256: "x",
      r2Etag: "etag-old-key",
      redactionPolicyVersion: "v1",
      status: "completed",
      startedAt: "2026-04-09T00:00:00Z",
      completedAt: "2026-04-09T00:01:00Z",
      errorMessage: null,
    });
    const r2 = makeR2();
    const res = await exportToR2(
      { db, r2, manifest, reportIssue: async () => {} },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
      },
    );
    expect(r2.puts).toHaveLength(0);
    expect(res.manifests[0]!.id).toBe("preexisting");
  });

  it("redaction violation marks partition as failed and reports issue", async () => {
    const badRow: Row = {
      id: "evt2",
      occurred_at: "2026-04-08T10:00:00Z",
      occurred_at_ms: Date.parse("2026-04-08T10:00:00Z"),
      resource_id: "cf_pat_123456789012345678901234567890",
      raw_json: JSON.stringify({ note: "raw json is removed before export" }),
    };
    const db = makeDb({ "2026-04-08": [badRow] });
    const manifest = makeManifest();
    const r2 = makeR2();
    const reportIssue = vi.fn(async () => {});
    const res = await exportToR2(
      { db, r2, manifest, reportIssue },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
      },
    );
    expect(r2.puts).toHaveLength(0);
    expect(res.failedPartitions).toHaveLength(1);
    expect(reportIssue).toHaveBeenCalledOnce();
    const labels = reportIssue.mock.calls[0]![0].labels;
    expect(labels).toContain("type:security");
  });

  it("default window is 29..26 days before now", async () => {
    const db = makeDb({});
    const manifest = makeManifest();
    const r2 = makeR2();
    const res = await exportToR2(
      {
        db,
        r2,
        manifest,
        reportIssue: async () => {},
        now: () => new Date("2026-05-07T00:00:00Z"),
      },
      { dryRun: true },
    );
    expect(res.manifests).toHaveLength(3);
    const days = res.manifests.map((m) => m.dd).sort((a, b) => a - b);
    expect(days).toEqual([8, 9, 10]);
  });

  it("empty partition produces zero-row manifest entry", async () => {
    const db = makeDb({ "2026-04-08": [] });
    const manifest = makeManifest();
    const r2 = makeR2();
    const res = await exportToR2(
      { db, r2, manifest, reportIssue: async () => {} },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
      },
    );
    expect(res.manifests).toHaveLength(1);
    expect(res.manifests[0]!.rowCount).toBe(0);
  });

  it("R2 put failure marks partition as failed and continues", async () => {
    const db = makeDb({
      "2026-04-08": [goodRow],
      "2026-04-09": [
        {
          ...goodRow,
          id: "evt9",
          occurred_at: "2026-04-09T10:00:00Z",
          occurred_at_ms: Date.parse("2026-04-09T10:00:00Z"),
        },
      ],
    });
    const manifest = makeManifest();
    const r2: R2Client = {
      async putObject(key) {
        if (key.includes("dd=08")) throw new Error("simulated PUT failure");
        return { etag: "etag-" + key };
      },
      async getObject() {
        throw new Error("nope");
      },
      async listObjects() {
        return [];
      },
    };
    const reportIssue = vi.fn(async () => {});
    const res = await exportToR2(
      { db, r2, manifest, reportIssue },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-10T00:00:00Z"),
      },
    );
    expect(res.failedPartitions).toHaveLength(1);
    expect(res.manifests).toHaveLength(1); // 09 succeeded
    const labels = reportIssue.mock.calls[0]![0].labels;
    expect(labels).toContain("type:operations");
  });

  it("uses provided exportRunId", async () => {
    const db = makeDb({ "2026-04-08": [goodRow] });
    const manifest = makeManifest();
    const r2 = makeR2();
    const res = await exportToR2(
      { db, r2, manifest, reportIssue: async () => {} },
      {
        windowFromUtc: new Date("2026-04-08T00:00:00Z"),
        windowToUtc: new Date("2026-04-09T00:00:00Z"),
        exportRunId: "fixed-run-id",
      },
    );
    expect(res.exportRunId).toBe("fixed-run-id");
  });
});
