// Issue #315: application audit_log export-to-r2 integration tests
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { gunzipSync } from "node:zlib";
import {
  exportAuditLogToR2,
  guardExportJsonlOrThrow,
  type D1Like,
  type D1PreparedLike,
  type R2Client,
  type R2PutResult,
} from "../export-to-r2.ts";

// ---------------- in-memory D1 fake ----------------

interface AuditLogRow {
  audit_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
}

interface ManifestRow {
  id: string;
  export_run_id: string;
  yyyy: number;
  mm: number;
  dd: number;
  object_key: string;
  row_count: number;
  uncompressed_bytes: number;
  compressed_bytes: number;
  sha256: string;
  r2_etag: string | null;
  status: "pending" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

class FakeD1 implements D1Like {
  auditLog: AuditLogRow[] = [];
  manifests: ManifestRow[] = [];

  prepare(sql: string): D1PreparedLike {
    return new FakePrepared(this, sql);
  }
}

class FakePrepared implements D1PreparedLike {
  private values: unknown[] = [];
  constructor(
    private readonly db: FakeD1,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): D1PreparedLike {
    this.values = values;
    return this;
  }

  async run(): Promise<unknown> {
    const s = this.sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("INSERT INTO audit_log_export_manifest")) {
      const [id, exportRunId, yyyy, mm, dd, objectKey, rowCount, uBytes, cBytes, sha256, startedAt] =
        this.values as [
          string, string, number, number, number, string, number, number, number, string, string,
        ];
      // UNIQUE(yyyy,mm,dd) emulation
      if (
        this.db.manifests.some(
          (m) => m.yyyy === yyyy && m.mm === mm && m.dd === dd,
        )
      ) {
        throw new Error("UNIQUE constraint failed: (yyyy,mm,dd)");
      }
      this.db.manifests.push({
        id,
        export_run_id: exportRunId,
        yyyy,
        mm,
        dd,
        object_key: objectKey,
        row_count: rowCount,
        uncompressed_bytes: uBytes,
        compressed_bytes: cBytes,
        sha256,
        r2_etag: null,
        status: "pending",
        started_at: startedAt,
        completed_at: null,
        error_message: null,
      });
      return {};
    }
    if (s.startsWith("UPDATE audit_log_export_manifest SET export_run_id=")) {
      const [id, exportRunId, rowCount, uBytes, cBytes, sha256, startedAt] =
        this.values as [string, string, number, number, number, string, string];
      const m = this.db.manifests.find((x) => x.id === id);
      if (m) {
        m.export_run_id = exportRunId;
        m.row_count = rowCount;
        m.uncompressed_bytes = uBytes;
        m.compressed_bytes = cBytes;
        m.sha256 = sha256;
        m.status = "pending";
        m.started_at = startedAt;
        m.completed_at = null;
        m.error_message = null;
      }
      return {};
    }
    if (s.startsWith("UPDATE audit_log_export_manifest SET status='completed'")) {
      const [id, etag, completedAt] = this.values as [string, string, string];
      const m = this.db.manifests.find((x) => x.id === id);
      if (m) {
        m.status = "completed";
        m.r2_etag = etag;
        m.completed_at = completedAt;
        m.error_message = null;
      }
      return {};
    }
    if (s.startsWith("UPDATE audit_log_export_manifest SET status='failed'")) {
      const [id, errMsg, completedAt] = this.values as [string, string, string];
      const m = this.db.manifests.find((x) => x.id === id);
      if (m) {
        m.status = "failed";
        m.error_message = errMsg;
        m.completed_at = completedAt;
      }
      return {};
    }
    throw new Error(`unmocked run() sql: ${s}`);
  }

  async first<T>(): Promise<T | null> {
    const s = this.sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("SELECT id, status")) {
      const [yyyy, mm, dd] = this.values as [number, number, number];
      const m = this.db.manifests.find(
        (x) => x.yyyy === yyyy && x.mm === mm && x.dd === dd,
      );
      return (m ? { id: m.id, status: m.status, objectKey: m.object_key } : null) as T | null;
    }
    throw new Error(`unmocked first() sql: ${s}`);
  }

  async all<T>(): Promise<{ results: T[] }> {
    const s = this.sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("SELECT audit_id")) {
      const [fromUtc, toUtc, limit, offset] = this.values as [
        string,
        string,
        number,
        number,
      ];
      const filtered = this.db.auditLog
        .filter((r) => r.created_at >= fromUtc && r.created_at < toUtc)
        .sort((a, b) =>
          a.created_at === b.created_at
            ? a.audit_id.localeCompare(b.audit_id)
            : a.created_at.localeCompare(b.created_at),
        );
      return { results: filtered.slice(offset, offset + limit) as T[] };
    }
    throw new Error(`unmocked all() sql: ${s}`);
  }
}

// ---------------- fake R2 ----------------

class FakeR2 implements R2Client {
  puts: Array<{
    key: string;
    body: Uint8Array;
    metadata: Record<string, string>;
  }> = [];
  failNext = false;

  async putObject(
    key: string,
    body: Uint8Array,
    opts: { contentType: string; contentEncoding: string; metadata: Record<string, string> },
  ): Promise<R2PutResult> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("simulated R2 failure");
    }
    this.puts.push({ key, body, metadata: opts.metadata });
    return { etag: `etag-${this.puts.length}` };
  }
}

// ---------------- tests ----------------

const seedRow = (db: FakeD1, createdAt: string, suffix = ""): void => {
  db.auditLog.push({
    audit_id: `audit-${createdAt}-${suffix}`,
    actor_id: null,
    actor_email: `user${suffix}@example.com`,
    action: "test.fired",
    target_type: "system",
    target_id: null,
    before_json: null,
    after_json: JSON.stringify({ email: `inner${suffix}@example.com`, ok: true }),
    created_at: createdAt,
  });
};

const TARGET = new Date(Date.UTC(2026, 0, 2));

describe("exportAuditLogToR2", () => {
  let db: FakeD1;
  let r2: FakeR2;

  beforeEach(() => {
    db = new FakeD1();
    r2 = new FakeR2();
  });

  it("TC-EXP-01: dry-run は R2 PUT を呼ばず manifest を挿入しない", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    const res = await exportAuditLogToR2(
      { db, r2 },
      { targetDate: TARGET, dryRun: true },
    );
    expect(r2.puts.length).toBe(0);
    expect(db.manifests.length).toBe(0);
    expect(res.status).toBe("pending");
    expect(res.rowCount).toBe(1);
  });

  it("TC-EXP-02: 正常 path で D1→redact→gzip→R2→manifest completed", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    const res = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(res.status).toBe("completed");
    expect(r2.puts.length).toBe(1);
    expect(db.manifests[0]!.status).toBe("completed");
    expect(db.manifests[0]!.r2_etag).toBe("etag-1");
  });

  it("TC-EXP-03: R2 PUT 失敗時は manifest failed", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    r2.failNext = true;
    const res = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(res.status).toBe("failed");
    expect(db.manifests[0]!.status).toBe("failed");
    expect(db.manifests[0]!.error_message).toContain("simulated R2 failure");
  });

  it("TC-EXP-04: 同日 2 回目は idempotent skip", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    const res2 = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(res2.status).toBe("skipped");
    expect(r2.puts.length).toBe(1);
  });

  it("TC-EXP-05: 出力 JSONL に raw email / phone が含まれない", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    const body = r2.puts[0]!.body;
    const decoded = gunzipSync(Buffer.from(body)).toString("utf8");
    expect(decoded).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(decoded).not.toMatch(/\d{3}-\d{4}-\d{4}/);
    expect(decoded).toContain("[REDACTED:actor_email]");
  });

  it("TC-EXP-06: object_key 形式が application/yyyy=.../mm=.../dd=.../audit-log-<runId>.jsonl.gz", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    const res = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(res.objectKey).toMatch(
      /^application\/yyyy=2026\/mm=01\/dd=02\/audit-log-[0-9a-f-]+\.jsonl\.gz$/,
    );
  });

  it("TC-EXP-07: sha256 が manifest と R2 metadata で一致", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    const res = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(db.manifests[0]!.sha256).toBe(res.sha256);
    expect(r2.puts[0]!.metadata.sha256).toBe(res.sha256);
  });

  it("TC-EXP-08: row_count=0 でも manifest completed を挿入", async () => {
    const res = await exportAuditLogToR2({ db, r2 }, { targetDate: TARGET });
    expect(res.status).toBe("completed");
    expect(res.rowCount).toBe(0);
    expect(db.manifests[0]!.status).toBe("completed");
    expect(db.manifests[0]!.row_count).toBe(0);
  });

  it("TC-EXP-09: guardExportJsonlOrThrow は raw PII を fail-closed にする", () => {
    expect(() => guardExportJsonlOrThrow('{"actorEmail":"raw@example.com"}\n')).toThrow(
      /raw email/,
    );
    expect(() => guardExportJsonlOrThrow('{"phone":"090-1234-5678"}\n')).toThrow(
      /raw phone/,
    );
    expect(() => guardExportJsonlOrThrow('{"address":"〒650-0001 神戸市中央区"}\n')).toThrow(
      /raw address/,
    );
  });

  it("TC-EXP-10: failed manifest retry keeps object_key and refreshes manifest metadata", async () => {
    seedRow(db, "2026-01-02T05:00:00.000Z", "a");
    r2.failNext = true;
    const failed = await exportAuditLogToR2(
      { db, r2 },
      { targetDate: TARGET, exportRunId: "11111111-1111-4111-8111-111111111111" },
    );
    expect(failed.status).toBe("failed");
    const failedObjectKey = db.manifests[0]!.object_key;

    db.auditLog.push({
      audit_id: "audit-retry-extra",
      actor_id: null,
      actor_email: "retry@example.com",
      action: "test.fired",
      target_type: "system",
      target_id: null,
      before_json: null,
      after_json: JSON.stringify({ ok: true }),
      created_at: "2026-01-02T06:00:00.000Z",
    });

    const retried = await exportAuditLogToR2(
      { db, r2 },
      { targetDate: TARGET, exportRunId: "22222222-2222-4222-8222-222222222222" },
    );
    expect(retried.status).toBe("completed");
    expect(retried.objectKey).toBe(failedObjectKey);
    expect(db.manifests[0]!.object_key).toBe(failedObjectKey);
    expect(db.manifests[0]!.export_run_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(db.manifests[0]!.row_count).toBe(2);
  });
});
