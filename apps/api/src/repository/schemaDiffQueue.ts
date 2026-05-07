import type { DbCtx } from "./_shared/db";
import type { StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";

export type DiffType = "added" | "changed" | "removed" | "unresolved";
export type DiffStatus = "queued" | "resolved";
// UT-07B: pending|running|completed|exhausted|failed
//   - pending: enqueue 直後（consumer 未処理）
//   - running: consumer 処理中（互換: 旧 in_progress も同義として扱う）
//   - exhausted: CPU budget 枯渇で 1 batch 中断、retry_count++ で再 enqueue 可
//   - completed: remaining=0 到達
//   - failed: retry_count 上限超過 + failed_items_json に退避済
export type BackfillStatus =
  | "pending"
  | "running"
  | "in_progress"
  | "completed"
  | "exhausted"
  | "failed";

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
  // UT-07B-FU-01: queue/cron split
  dedupeKey: string | null;
  failedItemsJson: string | null;
  retryCount: number;
  lastError: string | null;
  lastProcessedAt: string | null;
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
  dedupe_key: string | null;
  failed_items_json: string | null;
  retry_count: number | null;
  last_error: string | null;
  last_processed_at: string | null;
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
  dedupeKey: r.dedupe_key ?? null,
  failedItemsJson: r.failed_items_json ?? null,
  retryCount: r.retry_count ?? 0,
  lastError: r.last_error ?? null,
  lastProcessedAt: r.last_processed_at ?? null,
  createdAt: r.created_at,
});

const SELECT_COLS =
  "SELECT diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, resolved_by, resolved_at, backfill_cursor, backfill_status, dedupe_key, failed_items_json, retry_count, last_error, last_processed_at, created_at FROM schema_diff_queue";

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

// UT-07B-FU-01: dedupe_key 設定 + 衝突 detection（INSERT OR IGNORE 相当を D1 で）
export async function tryReserveDedupeKey(
  c: DbCtx,
  diffId: string,
  dedupeKey: string,
): Promise<{ alreadyEnqueued: boolean }> {
  // 既に同 dedupe_key を持つ別 diff があるか確認（UNIQUE index 違反を事前回避）
  const existing = await c.db
    .prepare("SELECT diff_id FROM schema_diff_queue WHERE dedupe_key = ?1")
    .bind(dedupeKey)
    .first<{ diff_id: string }>();
  if (existing && existing.diff_id !== diffId) {
    return { alreadyEnqueued: true };
  }
  // 当該 diff の dedupe_key を冪等に書き込み（同一 diff の再 enqueue は alreadyEnqueued=true で扱う）
  const me = await c.db
    .prepare("SELECT dedupe_key FROM schema_diff_queue WHERE diff_id = ?1")
    .bind(diffId)
    .first<{ dedupe_key: string | null }>();
  if (me?.dedupe_key === dedupeKey) {
    return { alreadyEnqueued: true };
  }
  await c.db
    .prepare(
      "UPDATE schema_diff_queue SET dedupe_key = ?1 WHERE diff_id = ?2",
    )
    .bind(dedupeKey, diffId)
    .run();
  return { alreadyEnqueued: false };
}

export async function clearDedupeKey(c: DbCtx, diffId: string): Promise<void> {
  await c.db
    .prepare("UPDATE schema_diff_queue SET dedupe_key = ? WHERE diff_id = ?")
    .bind(null, diffId)
    .run();
}

// Issue #503: cursor 経路 shadow flag 用 helper。
// 既存 `backfill_cursor` (TEXT) 列を再利用するため migration 不要。
// adoption 後に専用列が追加される場合は本実装を差し替える。
export async function getBackfillCursor(
  c: DbCtx,
  diffId: string,
): Promise<string | null> {
  const r = await c.db
    .prepare("SELECT backfill_cursor FROM schema_diff_queue WHERE diff_id = ?1")
    .bind(diffId)
    .first<{ backfill_cursor: string | null }>();
  return r?.backfill_cursor ?? null;
}

export async function updateBackfillCursor(
  c: DbCtx,
  diffId: string,
  cursor: string | null,
): Promise<void> {
  await c.db
    .prepare("UPDATE schema_diff_queue SET backfill_cursor = ?1 WHERE diff_id = ?2")
    .bind(cursor, diffId)
    .run();
}

export async function recordBatchProgress(
  c: DbCtx,
  diffId: string,
  patch: {
    status: BackfillStatus;
    cursor?: string | null;
    failedItemsJson?: string | null;
    retryCount?: number;
    lastError?: string | null;
    lastProcessedAt?: string | null;
  },
): Promise<void> {
  const sets: string[] = ["backfill_status = ?"];
  const params: unknown[] = [patch.status];
  if (patch.cursor !== undefined) {
    sets.push("backfill_cursor = ?");
    params.push(patch.cursor);
  }
  if (patch.failedItemsJson !== undefined) {
    sets.push("failed_items_json = ?");
    params.push(patch.failedItemsJson);
  }
  if (patch.retryCount !== undefined) {
    sets.push("retry_count = ?");
    params.push(patch.retryCount);
  }
  if (patch.lastError !== undefined) {
    sets.push("last_error = ?");
    params.push(patch.lastError);
  }
  if (patch.lastProcessedAt !== undefined) {
    sets.push("last_processed_at = ?");
    params.push(patch.lastProcessedAt);
  }
  params.push(diffId);
  await c.db
    .prepare(`UPDATE schema_diff_queue SET ${sets.join(", ")} WHERE diff_id = ?`)
    .bind(...params)
    .run();
}
