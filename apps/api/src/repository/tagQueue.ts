import type { DbCtx, D1Stmt } from "./_shared/db";
import type { MemberId, ResponseId } from "./_shared/brand";
import { asMemberId, asResponseId, auditAction } from "./_shared/brand";

// 07a / ut-02a: candidate / confirmed / rejected / dlq の semantics を既存値に alias する。
//   queued    = candidate（初期投入）
//   reviewing = レビュー中（任意の中間状態）
//   resolved  = confirmed（member_tags 反映済）
//   rejected  = 却下（reason 必須、07a で追加）
//   dlq       = retry 上限超過の poison message（ut-02a で追加）
export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected" | "dlq";

// 状態遷移マップ（unidirectional）
//   既存 02b の遷移（queued→reviewing→resolved）を維持しつつ、
//   07a workflow が担当する直接遷移（queued→resolved / queued→rejected /
//   reviewing→rejected）も許可する。終端 (resolved/rejected/dlq) からの遷移は禁止。
//   queued→dlq は incrementRetry / moveToDlq による retry 上限超過時のみ。
export const ALLOWED_TRANSITIONS: Readonly<Record<TagQueueStatus, readonly TagQueueStatus[]>> = {
  queued: ["reviewing", "resolved", "rejected", "dlq"],
  reviewing: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
  dlq: [],
};

export function isAllowedTransition(from: TagQueueStatus, to: TagQueueStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface TagAssignmentQueueRow {
  queueId: string;
  memberId: MemberId;
  responseId: ResponseId;
  status: TagQueueStatus;
  suggestedTagsJson: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  // ut-02a 拡張（migration 0009）。既存行は null/0 のまま読み出される。
  idempotencyKey: string | null;
  attemptCount: number;
  lastError: string | null;
  nextVisibleAt: string | null;
  dlqAt: string | null;
}

export interface NewTagAssignmentQueueRow {
  queueId: string;
  memberId: MemberId;
  responseId: ResponseId;
  suggestedTagsJson: string;
  reason: string | null;
}

export interface NewTagAssignmentQueueRowIdempotent extends NewTagAssignmentQueueRow {
  idempotencyKey: string;
}

interface DbRow {
  queue_id: string;
  member_id: string;
  response_id: string;
  status: TagQueueStatus;
  suggested_tags_json: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
  idempotency_key: string | null;
  attempt_count: number | null;
  last_error: string | null;
  next_visible_at: string | null;
  dlq_at: string | null;
}

const map = (r: DbRow): TagAssignmentQueueRow => ({
  queueId: r.queue_id,
  memberId: asMemberId(r.member_id),
  responseId: asResponseId(r.response_id),
  status: r.status,
  suggestedTagsJson: r.suggested_tags_json,
  reason: r.reason,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  idempotencyKey: r.idempotency_key ?? null,
  attemptCount: r.attempt_count ?? 0,
  lastError: r.last_error ?? null,
  nextVisibleAt: r.next_visible_at ?? null,
  dlqAt: r.dlq_at ?? null,
});

const SELECT_COLS =
  "SELECT queue_id, member_id, response_id, status, suggested_tags_json, reason, created_at, updated_at, idempotency_key, attempt_count, last_error, next_visible_at, dlq_at FROM tag_assignment_queue";

// ut-02a 設定値
export const TAG_QUEUE_MAX_RETRY = 3;
export const TAG_QUEUE_BACKOFF_BASE_SEC = 30;
export const TAG_QUEUE_TICK_BATCH_SIZE = 20;
export const TAG_QUEUE_TICK_MAX_RUNTIME_MS = 20_000;
export const TAG_QUEUE_TICK_CRON = "*/5 * * * *";
export const TAG_QUEUE_DLQ_AUDIT_ACTION = "admin.tag.queue_dlq_moved";
export const TAG_QUEUE_SYSTEM_ACTOR_EMAIL = "system@retry-tick";

export async function listQueue(c: DbCtx, status?: TagQueueStatus): Promise<TagAssignmentQueueRow[]> {
  if (status) {
    const r = await c.db.prepare(`${SELECT_COLS} WHERE status = ? ORDER BY created_at ASC`).bind(status).all<DbRow>();
    return (r.results ?? []).map(map);
  }
  const r = await c.db.prepare(`${SELECT_COLS} ORDER BY created_at ASC`).all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function findQueueById(c: DbCtx, queueId: string): Promise<TagAssignmentQueueRow | null> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE queue_id = ?`).bind(queueId).first<DbRow>();
  return r ? map(r) : null;
}

export async function enqueue(c: DbCtx, row: NewTagAssignmentQueueRow): Promise<TagAssignmentQueueRow> {
  await c.db
    .prepare(
      "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, suggested_tags_json, reason) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(row.queueId, row.memberId, row.responseId, row.suggestedTagsJson, row.reason)
    .run();
  const found = await findQueueById(c, row.queueId);
  if (!found) throw new Error(`enqueue failed for ${row.queueId}`);
  return found;
}

export async function transitionStatus(
  c: DbCtx,
  queueId: string,
  next: TagQueueStatus,
): Promise<TagAssignmentQueueRow> {
  const current = await findQueueById(c, queueId);
  if (!current) throw new Error(`queue ${queueId} not found`);
  if (!isAllowedTransition(current.status, next)) {
    throw new RangeError(
      `invalid transition: ${current.status} → ${next} (queue=${queueId})`,
    );
  }
  await c.db
    .prepare(
      "UPDATE tag_assignment_queue SET status = ?, updated_at = ? WHERE queue_id = ?",
    )
    .bind(next, new Date().toISOString(), queueId)
    .run();
  const updated = await findQueueById(c, queueId);
  if (!updated) throw new Error(`transitionStatus reload failed for ${queueId}`);
  return updated;
}

// ============================================================
// ut-02a 拡張: idempotency / retry / DLQ
// ============================================================

/** idempotency_key で row を 1 件取得（ut-02a / AC-3） */
export async function findByIdempotencyKey(
  c: DbCtx,
  key: string,
): Promise<TagAssignmentQueueRow | null> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE idempotency_key = ?`)
    .bind(key)
    .first<DbRow>();
  return r ? map(r) : null;
}

/**
 * idempotent な enqueue（ut-02a / AC-3）。
 * 同一 idempotency_key の既存行があればそれを返し、無ければ INSERT して返す。
 * fakeD1 の制約上 ON CONFLICT を使わず、findByIdempotencyKey → INSERT の 2 段で実装。
 * 並行 INSERT で UNIQUE 制約違反になった場合は再度 SELECT して既存行を返す。
 */
export async function createIdempotent(
  c: DbCtx,
  row: NewTagAssignmentQueueRowIdempotent,
): Promise<{ row: TagAssignmentQueueRow; isExisting: boolean }> {
  const existing = await findByIdempotencyKey(c, row.idempotencyKey);
  if (existing) return { row: existing, isExisting: true };

  try {
    await c.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, suggested_tags_json, reason, idempotency_key) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        row.queueId,
        row.memberId,
        row.responseId,
        row.suggestedTagsJson,
        row.reason,
        row.idempotencyKey,
      )
      .run();
  } catch (e) {
    // race lost: 並行 INSERT で UNIQUE 違反 → 既存 row を返す
    const after = await findByIdempotencyKey(c, row.idempotencyKey);
    if (after) return { row: after, isExisting: true };
    throw e;
  }

  const created = await findByIdempotencyKey(c, row.idempotencyKey);
  if (!created) throw new Error(`createIdempotent: row not found after insert (${row.queueId})`);
  return { row: created, isExisting: false };
}

/**
 * pending（queued + 可視時刻到来済）行を取得（ut-02a / AC-1, retry tick 用）。
 * fakeD1 が `<=` を解釈できないため、`status='queued'` のみ DB で絞り、JS 側で next_visible_at をフィルタする。
 */
export async function listPending(
  c: DbCtx,
  opts: { now: string; limit?: number } = { now: new Date().toISOString() },
): Promise<TagAssignmentQueueRow[]> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE status = ? ORDER BY created_at ASC`)
    .bind("queued")
    .all<DbRow>();
  const rows = (r.results ?? []).map(map);
  const visible = rows.filter(
    (row) => row.nextVisibleAt === null || row.nextVisibleAt <= opts.now,
  );
  return typeof opts.limit === "number" ? visible.slice(0, opts.limit) : visible;
}

/** DLQ 行を取得（ut-02a / AC-1） */
export async function listDlq(
  c: DbCtx,
  opts: { limit?: number } = {},
): Promise<TagAssignmentQueueRow[]> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE status = ? ORDER BY created_at ASC`)
    .bind("dlq")
    .all<DbRow>();
  const rows = (r.results ?? []).map(map);
  return typeof opts.limit === "number" ? rows.slice(0, opts.limit) : rows;
}

/**
 * retry 試行回数を 1 増やし、上限超過なら DLQ に移送する（ut-02a / AC-4）。
 * guarded: 現状 status が queued の行のみ更新する（terminal 行は触らない＝fail-closed）。
 */
export async function incrementRetry(
  c: DbCtx,
  queueId: string,
  errorMessage: string,
  now: string,
  maxRetry: number = TAG_QUEUE_MAX_RETRY,
): Promise<{ moved: "retry" | "dlq" | "noop" }> {
  const current = await findQueueById(c, queueId);
  if (!current || current.status !== "queued") {
    return { moved: "noop" };
  }
  const retry = buildRetryUpdate(c, current, errorMessage, now, maxRetry);
  await retry.update.run();
  return { moved: retry.moved };
}

/**
 * 明示的 DLQ 移送（ut-02a / AC-4）。
 * guarded: queued 状態の行のみ DLQ に移す（terminal は no-op）。
 */
export async function moveToDlq(
  c: DbCtx,
  queueId: string,
  errorMessage: string,
  now: string,
): Promise<{ changed: boolean }> {
  const current = await findQueueById(c, queueId);
  if (!current || current.status !== "queued") return { changed: false };
  await buildDlqUpdate(c, current, errorMessage, now, current.attemptCount).run();
  return { changed: true };
}

export async function incrementRetryWithDlqAudit(
  c: DbCtx,
  queueId: string,
  errorMessage: string,
  now: string,
  actorEmail: string = TAG_QUEUE_SYSTEM_ACTOR_EMAIL,
  maxRetry: number = TAG_QUEUE_MAX_RETRY,
): Promise<{ moved: "retry" | "dlq" | "noop" }> {
  const current = await findQueueById(c, queueId);
  if (!current || current.status !== "queued") return { moved: "noop" };

  const retry = buildRetryUpdate(c, current, errorMessage, now, maxRetry);
  if (retry.moved !== "dlq") {
    await retry.update.run();
    return { moved: retry.moved };
  }

  const audit = buildDlqAuditInsert(c, current, errorMessage, now, actorEmail, retry.nextAttempt);
  if (typeof c.db.batch === "function") {
    await c.db.batch([retry.update, audit]);
  } else {
    await retry.update.run();
    await audit.run();
  }
  return { moved: "dlq" };
}

export async function moveToDlqWithAudit(
  c: DbCtx,
  queueId: string,
  errorMessage: string,
  now: string,
  actorEmail: string = TAG_QUEUE_SYSTEM_ACTOR_EMAIL,
): Promise<{ changed: boolean }> {
  const current = await findQueueById(c, queueId);
  if (!current || current.status !== "queued") return { changed: false };

  const update = buildDlqUpdate(c, current, errorMessage, now, current.attemptCount);
  const audit = buildDlqAuditInsert(c, current, errorMessage, now, actorEmail, current.attemptCount);
  if (typeof c.db.batch === "function") {
    await c.db.batch([update, audit]);
  } else {
    await update.run();
    await audit.run();
  }
  return { changed: true };
}

function buildRetryUpdate(
  c: DbCtx,
  current: TagAssignmentQueueRow,
  errorMessage: string,
  now: string,
  maxRetry: number,
): { moved: "retry" | "dlq"; nextAttempt: number; update: D1Stmt } {
  const nextAttempt = current.attemptCount + 1;
  if (nextAttempt > maxRetry) {
    return {
      moved: "dlq",
      nextAttempt,
      update: buildDlqUpdate(c, current, errorMessage, now, nextAttempt),
    };
  }

  const backoffSec = TAG_QUEUE_BACKOFF_BASE_SEC * 2 ** (nextAttempt - 1);
  const nextVisible = new Date(new Date(now).getTime() + backoffSec * 1000).toISOString();
  return {
    moved: "retry",
    nextAttempt,
    update: c.db
      .prepare(
        "UPDATE tag_assignment_queue SET attempt_count = ?, last_error = ?, next_visible_at = ?, updated_at = ? WHERE queue_id = ? AND status = ?",
      )
      .bind(nextAttempt, errorMessage, nextVisible, now, current.queueId, "queued"),
  };
}

function buildDlqUpdate(
  c: DbCtx,
  current: TagAssignmentQueueRow,
  errorMessage: string,
  now: string,
  attemptCount: number,
): D1Stmt {
  return c.db
    .prepare(
      "UPDATE tag_assignment_queue SET status = ?, dlq_at = ?, last_error = ?, attempt_count = ?, updated_at = ? WHERE queue_id = ? AND status = ?",
    )
    .bind("dlq", now, errorMessage, attemptCount, now, current.queueId, "queued");
}

function buildDlqAuditInsert(
  c: DbCtx,
  current: TagAssignmentQueueRow,
  errorMessage: string,
  now: string,
  actorEmail: string,
  attemptCount: number,
): D1Stmt {
  return c.db
    .prepare(
      "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    )
    .bind(
      crypto.randomUUID(),
      actorEmail,
      auditAction(TAG_QUEUE_DLQ_AUDIT_ACTION),
      "tag_queue",
      current.queueId,
      JSON.stringify({ status: current.status, attemptCount: current.attemptCount }),
      JSON.stringify({
        status: "dlq",
        attemptCount,
        lastError: errorMessage,
        dlqAt: now,
      }),
      now,
    );
}

/** idempotency_key 生成 helper（deterministic） */
export function deriveIdempotencyKey(input: { memberId: string; responseId: string }): string {
  return `${input.memberId}:${input.responseId}`;
}
