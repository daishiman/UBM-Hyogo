// Issue #315: audit_log cold storage export repository integration tests
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as auditLog from "../auditLog";
import { adminEmail, auditAction } from "../_shared/brand";

const appendAt = async (
  env: InMemoryD1,
  createdAt: string,
  targetId: string,
) => {
  await auditLog.append(env.ctx, {
    actorId: null,
    actorEmail: adminEmail("owner@example.com"),
    action: auditAction("export.test"),
    targetType: "system",
    targetId,
    after: { v: 1 },
    createdAt,
  });
};

describe("auditLog cold storage export", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("TC-REP-01: listForExport は範囲内のみ返却", async () => {
    await appendAt(env, "2026-01-01T00:00:00.000Z", "a");
    await appendAt(env, "2026-01-02T12:00:00.000Z", "b");
    await appendAt(env, "2026-01-03T00:00:00.000Z", "c");

    const rows = await auditLog.listForExport(env.ctx, {
      fromUtc: "2026-01-02T00:00:00.000Z",
      toUtcExclusive: "2026-01-03T00:00:00.000Z",
      limit: 100,
    });
    expect(rows.map((r) => r.targetId)).toEqual(["b"]);
  });

  it("TC-REP-02: insertExportManifest は (yyyy,mm,dd) UNIQUE 違反で throw", async () => {
    await auditLog.insertExportManifest(env.ctx, {
      exportRunId: "run-1",
      yyyy: 2026,
      mm: 1,
      dd: 1,
      objectKey: "application/yyyy=2026/mm=01/dd=01/audit-log-run-1.jsonl.gz",
      rowCount: 0,
      uncompressedBytes: 0,
      compressedBytes: 20,
      sha256: "deadbeef",
      startedAt: "2026-01-02T03:00:00.000Z",
    });
    await expect(
      auditLog.insertExportManifest(env.ctx, {
        exportRunId: "run-2",
        yyyy: 2026,
        mm: 1,
        dd: 1,
        objectKey: "x",
        rowCount: 0,
        uncompressedBytes: 0,
        compressedBytes: 0,
        sha256: "x",
        startedAt: "2026-01-02T04:00:00.000Z",
      }),
    ).rejects.toThrow();
  });

  it("TC-REP-03: completeExportManifest で status=completed に遷移", async () => {
    const { id } = await auditLog.insertExportManifest(env.ctx, {
      exportRunId: "run-1",
      yyyy: 2026,
      mm: 1,
      dd: 2,
      objectKey: "k",
      rowCount: 1,
      uncompressedBytes: 10,
      compressedBytes: 20,
      sha256: "deadbeef",
      startedAt: "2026-01-03T03:00:00.000Z",
    });
    await auditLog.completeExportManifest(env.ctx, id, {
      r2Etag: "etag-123",
      completedAt: "2026-01-03T03:01:00.000Z",
    });
    const got = await auditLog.findExportManifestByPartition(env.ctx, 2026, 1, 2);
    expect(got?.status).toBe("completed");
  });

  it("TC-REP-04: failExportManifest で status=failed + error_message 記録", async () => {
    const { id } = await auditLog.insertExportManifest(env.ctx, {
      exportRunId: "run-1",
      yyyy: 2026,
      mm: 2,
      dd: 1,
      objectKey: "k",
      rowCount: 0,
      uncompressedBytes: 0,
      compressedBytes: 0,
      sha256: "x",
      startedAt: "2026-02-02T03:00:00.000Z",
    });
    await auditLog.failExportManifest(env.ctx, id, {
      errorMessage: "boom",
      completedAt: "2026-02-02T03:01:00.000Z",
    });
    const got = await auditLog.findExportManifestByPartition(env.ctx, 2026, 2, 1);
    expect(got?.status).toBe("failed");
  });

  it("TC-REP-05: purgeExportedOlderThan は completed 被覆日のみ DELETE", async () => {
    await appendAt(env, "2026-01-01T05:00:00.000Z", "exported");
    await appendAt(env, "2026-01-02T05:00:00.000Z", "unexported");

    const { id } = await auditLog.insertExportManifest(env.ctx, {
      exportRunId: "run-1",
      yyyy: 2026,
      mm: 1,
      dd: 1,
      objectKey: "k",
      rowCount: 1,
      uncompressedBytes: 10,
      compressedBytes: 20,
      sha256: "x",
      startedAt: "2026-01-02T03:00:00.000Z",
    });
    await auditLog.completeExportManifest(env.ctx, id, {
      r2Etag: "e",
      completedAt: "2026-01-02T03:01:00.000Z",
    });

    const { deleted } = await auditLog.purgeExportedOlderThan(
      env.ctx,
      "2026-04-01T00:00:00.000Z",
    );
    expect(deleted).toBe(1);
    const remaining = await auditLog.listForExport(env.ctx, {
      fromUtc: "2026-01-01T00:00:00.000Z",
      toUtcExclusive: "2026-01-03T00:00:00.000Z",
      limit: 100,
    });
    expect(remaining.map((r) => r.targetId)).toEqual(["unexported"]);
  });

  it("TC-REP-06: failed 日付の purge は 0 件", async () => {
    await appendAt(env, "2026-03-01T05:00:00.000Z", "failed-day");
    const { id } = await auditLog.insertExportManifest(env.ctx, {
      exportRunId: "run-x",
      yyyy: 2026,
      mm: 3,
      dd: 1,
      objectKey: "k",
      rowCount: 0,
      uncompressedBytes: 0,
      compressedBytes: 0,
      sha256: "x",
      startedAt: "2026-03-02T03:00:00.000Z",
    });
    await auditLog.failExportManifest(env.ctx, id, {
      errorMessage: "boom",
      completedAt: "2026-03-02T03:01:00.000Z",
    });
    const { deleted } = await auditLog.purgeExportedOlderThan(
      env.ctx,
      "2026-06-01T00:00:00.000Z",
    );
    expect(deleted).toBe(0);
  });

  it("TC-REP-07: findExportManifestByPartition は未作成 partition を null にする", async () => {
    await expect(
      auditLog.findExportManifestByPartition(env.ctx, 2026, 12, 31),
    ).resolves.toBeNull();
  });
});
