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
import {
  requireProvider,
  type WriteTagNoteProviderCtx,
} from "../repository/_shared/provider-context";
import { auditAction } from "../repository/_shared/brand";
import type { AdminEmail, AdminId } from "../repository/_shared/brand";
import { getStatus as getMemberStatus } from "../repository/status";
import { asMemberId, asTagId } from "../repository/_shared/brand";

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
  c: WriteTagNoteProviderCtx,
  input: TagQueueResolveInput,
): Promise<TagQueueResolveResult> {
  const tagQueueProvider = requireProvider(c.var.tagQueueProvider, "tagQueueProvider");
  const tagDefinitionsProvider = requireProvider(
    c.var.tagDefinitionsProvider,
    "tagDefinitionsProvider",
  );
  const memberTagsProvider = requireProvider(c.var.memberTagsProvider, "memberTagsProvider");
  const auditLogProvider = requireProvider(c.var.auditLogProvider, "auditLogProvider");

  // payload 必須項目の最終チェック（zod を通っていれば成立しているが defensive）
  if (input.action === "confirmed" && (!input.tagCodes || input.tagCodes.length === 0)) {
    throw new TagQueueResolveError("missing_tag_codes", "tagCodes is required for confirmed");
  }
  if (input.action === "rejected" && (!input.reason || input.reason.length === 0)) {
    throw new TagQueueResolveError("missing_reason", "reason is required for rejected");
  }

  const queue = await tagQueueProvider.findQueueById(input.queueId);
  if (!queue) {
    throw new TagQueueResolveError("queue_not_found", `queue ${input.queueId} not found`);
  }

  // idempotent path: 既に同じ最終状態なら追加 audit なしで現状を返す
  if (queue.status === "resolved" && input.action === "confirmed") {
    const existingTagCodes = parseTagCodesArray(queue.suggestedTagsJson);
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
      queueId: queue.queueId,
      status: "resolved",
      resolvedAt: queue.updatedAt,
      memberId: queue.memberId,
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
      queueId: queue.queueId,
      status: "rejected",
      resolvedAt: queue.updatedAt,
      memberId: queue.memberId,
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
  const memberStatus = await getMemberStatus(c, asMemberId(queue.memberId));
  if (memberStatus && memberStatus.is_deleted === 1) {
    throw new TagQueueResolveError("member_deleted", `member ${queue.memberId} is deleted`);
  }

  // confirmed の場合は tagCodes すべてが tag_definitions に存在することを確認
  const resolvedTagIds: string[] = [];
  if (input.action === "confirmed") {
    for (const code of input.tagCodes!) {
      const def = await tagDefinitionsProvider.findByCode(code);
      if (!def) {
        throw new TagQueueResolveError("unknown_tag_code", `unknown tag code: ${code}`);
      }
      resolvedTagIds.push(def.tagId);
    }
  }

  const now = new Date().toISOString();
  const fromStatus = queue.status;

  // D1 は明示 transaction API を持たないため、まず repository provider の guarded UPDATE を実行し、
  // 成功した場合だけ後続の member_tags/audit を書き込む。race lost 時の副作用を防ぐ。
  if (input.action === "confirmed") {
    const updateResult = await tagQueueProvider.resolveConfirmed(
      input.queueId,
      input.tagCodes!,
      now,
    );
    if (!updateResult.changed) {
      throw new TagQueueResolveError("race_lost", "queue state changed during resolve");
    }
    await memberTagsProvider.assignTagsToMember(
      asMemberId(queue.memberId),
      resolvedTagIds.map(asTagId),
      input.actorUserId ?? "admin",
    );
    await auditLogProvider.append({
      actorId: input.actorUserId,
      actorEmail: input.actorEmail,
      action: auditAction("admin.tag.queue_resolved"),
      targetType: "tag_queue",
      targetId: input.queueId,
      before: { status: fromStatus },
      after: {
        status: "resolved",
        tagCodes: input.tagCodes,
        memberId: queue.memberId,
      },
      createdAt: now,
    });
  } else {
    const updateResult = await tagQueueProvider.resolveRejected(
      input.queueId,
      input.reason!,
      now,
    );
    if (!updateResult.changed) {
      throw new TagQueueResolveError("race_lost", "queue state changed during resolve");
    }
    await auditLogProvider.append({
      actorId: input.actorUserId,
      actorEmail: input.actorEmail,
      action: auditAction("admin.tag.queue_rejected"),
      targetType: "tag_queue",
      targetId: input.queueId,
      before: { status: fromStatus },
      after: {
        status: "rejected",
        reason: input.reason,
        memberId: queue.memberId,
      },
      createdAt: now,
    });
  }

  if (input.action === "confirmed") {
    return {
      queueId: input.queueId,
      status: "resolved",
      resolvedAt: now,
      memberId: queue.memberId,
      tagCodes: input.tagCodes!,
      idempotent: false,
    };
  }
  return {
    queueId: input.queueId,
    status: "rejected",
    resolvedAt: now,
    memberId: queue.memberId,
    reason: input.reason!,
    idempotent: false,
  };
}
