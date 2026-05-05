import type { DbCtx } from "./_shared/db";
import type { StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";

export type DiffType = "added" | "changed" | "removed" | "unresolved";
export type DiffStatus = "queued" | "resolved";
export type BackfillStatus = "pending" | "in_progress" | "completed" | "exhausted" | "failed";

export interface SchemaDiffQueueRow {
  diffId: string;
  revisionId: string;
  type: DiffType;
  questionId: string | null;
  stableKey: StableKey | null;
  label: string;
  suggestedStableKey: string | null;
  status: DiffStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  backfillCursor: string | null;
  backfillStatus: BackfillStatus | null;
  createdAt: string;
}

export interface NewSchemaDiffQueueRow {
  diffId: string;
  revisionId: string;
  type: DiffType;
  questionId: string | null;
  stableKey: StableKey | null;
  label: string;
  suggestedStableKey: string | null;
}

interface DbRow {
  diff_id: string;
  revision_id: string;
  type: DiffType;
  question_id: string | null;
  stable_key: string | null;
  label: string;
  suggested_stable_key: string | null;
  status: DiffStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  backfill_cursor: string | null;
  backfill_status: BackfillStatus | null;
  created_at: string;
}

const map = (r: DbRow): SchemaDiffQueueRow => ({
  diffId: r.diff_id,
  revisionId: r.revision_id,
  type: r.type,
  questionId: r.question_id,
  stableKey: r.stable_key === null ? null : asStableKey(r.stable_key),
  label: r.label,
  suggestedStableKey: r.suggested_stable_key,
  status: r.status,
  resolvedBy: r.resolved_by,
  resolvedAt: r.resolved_at,
  backfillCursor: r.backfill_cursor,
  backfillStatus: r.backfill_status,
  createdAt: r.created_at,
});

const SELECT_COLS =
  "SELECT diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, resolved_by, resolved_at, backfill_cursor, backfill_status, created_at FROM schema_diff_queue";

// 既定 (type 未指定): unresolved 相当の status='queued' を created_at ASC で返す (AC-5)
export async function list(c: DbCtx, type?: DiffType): Promise<SchemaDiffQueueRow[]> {
  if (type) {
    const r = await c.db
      .prepare(
        `${SELECT_COLS}
         WHERE type = ?
           AND (status = ? OR backfill_status IN ('in_progress', 'exhausted', 'failed'))
         ORDER BY created_at ASC`,
      )
      .bind(type, "queued")
      .all<DbRow>();
    return (r.results ?? []).map(map);
  }
  const r = await c.db
    .prepare(
      `${SELECT_COLS}
       WHERE status = ? OR backfill_status IN ('in_progress', 'exhausted', 'failed')
       ORDER BY created_at ASC`,
    )
    .bind("queued")
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function findById(c: DbCtx, diffId: string): Promise<SchemaDiffQueueRow | null> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE diff_id = ?`).bind(diffId).first<DbRow>();
  return r ? map(r) : null;
}

export async function enqueue(c: DbCtx, row: NewSchemaDiffQueueRow): Promise<SchemaDiffQueueRow> {
  await c.db
    .prepare(
      "INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      row.diffId,
      row.revisionId,
      row.type,
      row.questionId,
      row.stableKey,
      row.label,
      row.suggestedStableKey,
    )
    .run();
  const found = await findById(c, row.diffId);
  if (!found) throw new Error(`schemaDiff enqueue failed for ${row.diffId}`);
  return found;
}

export async function resolve(c: DbCtx, diffId: string, by: string): Promise<void> {
  const current = await findById(c, diffId);
  if (!current) throw new Error(`schema diff ${diffId} not found`);
  if (current.status === "resolved") return;
  const at = new Date().toISOString();
  await c.db
    .prepare(
      "UPDATE schema_diff_queue SET status = ?, resolved_by = ?, resolved_at = ? WHERE diff_id = ? AND status = ?",
    )
    .bind("resolved", by, at, diffId, "queued")
    .run();
}

export async function markBackfill(
  c: DbCtx,
  diffId: string,
  status: BackfillStatus,
  cursor: string | null,
): Promise<void> {
  await c.db
    .prepare(
      "UPDATE schema_diff_queue SET backfill_status = ?1, backfill_cursor = ?2 WHERE diff_id = ?3",
    )
    .bind(status, cursor, diffId)
    .run();
}
