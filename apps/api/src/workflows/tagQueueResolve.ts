// 07a: tag_assignment_queue resolve workflow（candidate → confirmed/rejected）
//
// 不変条件:
//   - #5: D1 アクセスは apps/api 内に閉じる
//   - #13: member_tags への INSERT は本 workflow 内 batch のみ
//
// 状態遷移（既存 02b の queued/reviewing/resolved を alias 利用）:
//   queued (=candidate) → resolved (=confirmed) | rejected
//   resolved → resolved（idempotent: 同一 tagCodes / 追加 audit なし）
//   rejected → rejected（idempotent: 同一 reason / 追加 audit なし）
//   resolved ↔ rejected は 409
//
// race 防御: UPDATE は WHERE status IN ('queued','reviewing') を含むため、
// changes=0 を 409 として扱う。後続の member_tags/audit 書き込みは UPDATE 成功後だけ流す。
import type { DbCtx, D1Stmt } from "../repository/_shared/db";
import { auditAction } from "../repository/_shared/brand";
import type { AdminEmail, AdminId } from "../repository/_shared/brand";
import { findByCode as findTagDefinitionByCode } from "../repository/tagDefinitions";
import { getStatus as getMemberStatus } from "../repository/status";
import { asMemberId } from "../repository/_shared/brand";

export type ResolveAction = "confirmed" | "rejected";

export interface TagQueueResolveInput {
  queueId: string;
  actorUserId: AdminId | null;
  actorEmail: AdminEmail | null;
  action: ResolveAction;
  tagCodes?: string[];
  reason?: string;
}

export interface TagQueueResolveResult {
  queueId: string;
  status: "resolved" | "rejected";
  resolvedAt: string;
  memberId: string;
  tagCodes?: string[];
  reason?: string;
  idempotent: boolean;
}

export type TagQueueResolveErrorCode =
  | "queue_not_found"
  | "state_conflict"
  | "member_deleted"
  | "unknown_tag_code"
  | "idempotent_payload_mismatch"
  | "race_lost"
  | "missing_tag_codes"
  | "missing_reason";

export class TagQueueResolveError extends Error {
  constructor(
    public readonly code: TagQueueResolveErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TagQueueResolveError";
  }
}

interface QueueRow {
  queue_id: string;
  member_id: string;
  status: string;
  suggested_tags_json: string;
  reason: string | null;
  updated_at: string;
}

const findQueue = async (c: DbCtx, queueId: string): Promise<QueueRow | null> => {
  return await c.db
    .prepare(
      "SELECT queue_id, member_id, status, suggested_tags_json, reason, updated_at FROM tag_assignment_queue WHERE queue_id = ?",
    )
    .bind(queueId)
    .first<QueueRow>();
};

const parseTagCodesArray = (json: string): string[] => {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
};

export async function tagQueueResolve(
  c: DbCtx,
  input: TagQueueResolveInput,
): Promise<TagQueueResolveResult> {
  // payload 必須項目の最終チェック（zod を通っていれば成立しているが defensive）
  if (input.action === "confirmed" && (!input.tagCodes || input.tagCodes.length === 0)) {
    throw new TagQueueResolveError("missing_tag_codes", "tagCodes is required for confirmed");
  }
  if (input.action === "rejected" && (!input.reason || input.reason.length === 0)) {
    throw new TagQueueResolveError("missing_reason", "reason is required for rejected");
  }

  const queue = await findQueue(c, input.queueId);
  if (!queue) {
    throw new TagQueueResolveError("queue_not_found", `queue ${input.queueId} not found`);
  }

  // idempotent path: 既に同じ最終状態なら追加 audit なしで現状を返す
  if (queue.status === "resolved" && input.action === "confirmed") {
    const existingTagCodes = parseTagCodesArray(queue.suggested_tags_json);
    const same =
      existingTagCodes.length === input.tagCodes!.length &&
      existingTagCodes.every((c) => input.tagCodes!.includes(c));
    if (!same) {
      throw new TagQueueResolveError(
        "idempotent_payload_mismatch",
        "queue already resolved with different tagCodes",
      );
    }
    return {
      queueId: queue.queue_id,
      status: "resolved",
      resolvedAt: queue.updated_at,
      memberId: queue.member_id,
      tagCodes: existingTagCodes,
      idempotent: true,
    };
  }
  if (queue.status === "rejected" && input.action === "rejected") {
    if (queue.reason !== input.reason) {
      throw new TagQueueResolveError(
        "idempotent_payload_mismatch",
        "queue already rejected with different reason",
      );
    }
    return {
      queueId: queue.queue_id,
      status: "rejected",
      resolvedAt: queue.updated_at,
      memberId: queue.member_id,
      reason: queue.reason ?? "",
      idempotent: true,
    };
  }

  // unidirectional: candidate (queued/reviewing) 以外からの遷移は 409
  if (queue.status !== "queued" && queue.status !== "reviewing") {
    throw new TagQueueResolveError(
      "state_conflict",
      `cannot transition from ${queue.status} to ${input.action}`,
    );
  }

  // member 削除チェック（不変条件 #13 の precondition）
  const memberStatus = await getMemberStatus(c, asMemberId(queue.member_id));
  if (memberStatus && memberStatus.is_deleted === 1) {
    throw new TagQueueResolveError("member_deleted", `member ${queue.member_id} is deleted`);
  }

  // confirmed の場合は tagCodes すべてが tag_definitions に存在することを確認
  const resolvedTagIds: string[] = [];
  if (input.action === "confirmed") {
    for (const code of input.tagCodes!) {
      const def = await findTagDefinitionByCode(c, code);
      if (!def) {
        throw new TagQueueResolveError("unknown_tag_code", `unknown tag code: ${code}`);
      }
      resolvedTagIds.push(def.tagId);
    }
  }

  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();
  const fromStatus = queue.status;

  // D1 は明示 transaction API を持たないため、まず guarded UPDATE を実行し、
  // 成功した場合だけ後続の member_tags/audit を書き込む。race lost 時の副作用を防ぐ。
  let updateStmt: D1Stmt;
  const followupStmts: D1Stmt[] = [];
  if (input.action === "confirmed") {
    updateStmt = c.db
      .prepare(
        "UPDATE tag_assignment_queue SET status = 'resolved', suggested_tags_json = ?, updated_at = ? WHERE queue_id = ? AND status IN ('queued','reviewing')",
      )
      .bind(JSON.stringify(input.tagCodes), now, input.queueId);
    for (let i = 0; i < resolvedTagIds.length; i++) {
      const tagId = resolvedTagIds[i]!;
      followupStmts.push(
        c.db
          .prepare(
            `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_at, assigned_by)
             VALUES (?1, ?2, 'admin_queue', 1.0, ?3, ?4)
             ON CONFLICT(member_id, tag_id) DO UPDATE SET
               source = excluded.source,
               confidence = excluded.confidence,
               assigned_at = excluded.assigned_at,
               assigned_by = excluded.assigned_by`,
          )
          .bind(queue.member_id, tagId, now, input.actorUserId ?? "admin"),
      );
    }
    followupStmts.push(
      c.db
        .prepare(
          "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          auditId,
          input.actorUserId,
          input.actorEmail,
          auditAction("admin.tag.queue_resolved"),
          "tag_queue",
          input.queueId,
          JSON.stringify({ status: fromStatus }),
          JSON.stringify({
            status: "resolved",
            tagCodes: input.tagCodes,
            memberId: queue.member_id,
          }),
          now,
        ),
    );
  } else {
    updateStmt = c.db
      .prepare(
        "UPDATE tag_assignment_queue SET status = 'rejected', reason = ?, updated_at = ? WHERE queue_id = ? AND status IN ('queued','reviewing')",
      )
      .bind(input.reason, now, input.queueId);
    followupStmts.push(
      c.db
        .prepare(
          "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          auditId,
          input.actorUserId,
          input.actorEmail,
          auditAction("admin.tag.queue_rejected"),
          "tag_queue",
          input.queueId,
          JSON.stringify({ status: fromStatus }),
          JSON.stringify({
            status: "rejected",
            reason: input.reason,
            memberId: queue.member_id,
          }),
          now,
        ),
    );
  }

  const updateResult = await updateStmt.run();
  const updateChanges = updateResult.meta?.changes ?? 0;
  if (updateChanges === 0) {
    throw new TagQueueResolveError("race_lost", "queue state changed during resolve");
  }
  for (const stmt of followupStmts) {
    await stmt.run();
  }

  if (input.action === "confirmed") {
    return {
      queueId: input.queueId,
      status: "resolved",
      resolvedAt: now,
      memberId: queue.member_id,
      tagCodes: input.tagCodes!,
      idempotent: false,
    };
  }
  return {
    queueId: input.queueId,
    status: "rejected",
    resolvedAt: now,
    memberId: queue.member_id,
    reason: input.reason!,
    idempotent: false,
  };
}
