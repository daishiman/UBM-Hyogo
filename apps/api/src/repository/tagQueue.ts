import type { DbCtx } from "./_shared/db";
import type { MemberId, ResponseId } from "./_shared/brand";
import { asMemberId, asResponseId } from "./_shared/brand";

// 07a: candidate / confirmed / rejected の semantics を既存値に alias する。
//   queued    = candidate（初期投入）
//   reviewing = レビュー中（任意の中間状態）
//   resolved  = confirmed（member_tags 反映済）
//   rejected  = 却下（reason 必須、07a で追加）
export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected";

// 状態遷移マップ（unidirectional）
//   既存 02b の遷移（queued→reviewing→resolved）を維持しつつ、
//   07a workflow が担当する直接遷移（queued→resolved / queued→rejected /
//   reviewing→rejected）も許可する。終端 (resolved/rejected) からの遷移は禁止。
export const ALLOWED_TRANSITIONS: Readonly<Record<TagQueueStatus, readonly TagQueueStatus[]>> = {
  queued: ["reviewing", "resolved", "rejected"],
  reviewing: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
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
}

export interface NewTagAssignmentQueueRow {
  queueId: string;
  memberId: MemberId;
  responseId: ResponseId;
  suggestedTagsJson: string;
  reason: string | null;
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
});

const SELECT_COLS =
  "SELECT queue_id, member_id, response_id, status, suggested_tags_json, reason, created_at, updated_at FROM tag_assignment_queue";

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
