import type { ExportManifestRow } from "./types.ts";

// 最小 D1Database interface（Workers runtime と互換、CLI からも使える）
export interface D1Like {
  prepare(sql: string): D1PreparedLike;
}

export interface D1PreparedLike {
  bind(...values: unknown[]): D1PreparedLike;
  run(): Promise<unknown>;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

type ManifestRowDb = {
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
  redaction_policy_version: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
};

function toRow(r: ManifestRowDb): ExportManifestRow {
  return {
    id: r.id,
    exportRunId: r.export_run_id,
    yyyy: r.yyyy,
    mm: r.mm,
    dd: r.dd,
    objectKey: r.object_key,
    rowCount: r.row_count,
    uncompressedBytes: r.uncompressed_bytes,
    compressedBytes: r.compressed_bytes,
    sha256: r.sha256,
    r2Etag: r.r2_etag,
    redactionPolicyVersion: "v1",
    status: r.status as ExportManifestRow["status"],
    startedAt: r.started_at,
    completedAt: r.completed_at,
    errorMessage: r.error_message,
  };
}

export interface ManifestPendingInsert {
  id: string;
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: string;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  sha256: string;
  startedAt: string;
}

export interface ManifestStore {
  insertPending(row: ManifestPendingInsert): Promise<void>;
  markCompleted(id: string, completedAt: string, r2Etag?: string | null): Promise<void>;
  markFailed(id: string, completedAt: string, errorMessage: string): Promise<void>;
  findByPartition(yyyy: number, mm: number, dd: number): Promise<ExportManifestRow | null>;
  listForRandomPick(limit: number): Promise<ExportManifestRow[]>;
}

export function createManifestStore(db: D1Like): ManifestStore {
  return {
    async insertPending(row) {
      await db
        .prepare(
          `INSERT INTO cf_audit_log_export_manifest (
             id, export_run_id, yyyy, mm, dd, object_key, row_count,
             uncompressed_bytes, compressed_bytes, sha256,
             redaction_policy_version, status, started_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'v1', 'pending', ?)`,
        )
        .bind(
          row.id,
          row.exportRunId,
          row.yyyy,
          row.mm,
          row.dd,
          row.objectKey,
          row.rowCount,
          row.uncompressedBytes,
          row.compressedBytes,
          row.sha256,
          row.startedAt,
        )
        .run();
    },
    async markCompleted(id, completedAt, r2Etag = null) {
      await db
        .prepare(
          `UPDATE cf_audit_log_export_manifest
             SET status = 'completed', completed_at = ?, r2_etag = ?, error_message = NULL
           WHERE id = ?`,
        )
        .bind(completedAt, r2Etag, id)
        .run();
    },
    async markFailed(id, completedAt, errorMessage) {
      await db
        .prepare(
          `UPDATE cf_audit_log_export_manifest
             SET status = 'failed', completed_at = ?, error_message = ?
           WHERE id = ?`,
        )
        .bind(completedAt, errorMessage, id)
        .run();
    },
    async findByPartition(yyyy, mm, dd) {
      const r = await db
        .prepare(
          `SELECT * FROM cf_audit_log_export_manifest WHERE yyyy = ? AND mm = ? AND dd = ?`,
        )
        .bind(yyyy, mm, dd)
        .first<ManifestRowDb>();
      return r ? toRow(r) : null;
    },
    async listForRandomPick(limit) {
      const r = await db
        .prepare(
          `SELECT * FROM cf_audit_log_export_manifest
             WHERE status = 'completed'
             ORDER BY started_at DESC
             LIMIT ?`,
        )
        .bind(limit)
        .all<ManifestRowDb>();
      return r.results.map(toRow);
    },
  };
}
