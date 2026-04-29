// 04b: /me/* のドメインサービス
// 不変条件 #4: response_fields に書き込まない。本ファイルは admin_member_notes と audit_log にのみ append する。
// 不変条件 #12: admin_member_notes は public/member view model に混ざらない。
//   このファイルは MemberProfile / PublicMemberProfile を import すらしない。

import type { DbCtx } from "../../repository/_shared/db";
import {
  asMemberId,
  type MemberId,
  type AdminEmail,
  adminEmail as toAdminEmail,
  auditAction as toAuditAction,
} from "../../repository/_shared/brand";
import * as adminNotes from "../../repository/adminNotes";
import * as auditLog from "../../repository/auditLog";
import { findCurrentResponse } from "../../repository/responses";

export interface AppendSelfRequestInput {
  ctx: DbCtx;
  memberId: MemberId;
  actorEmail: string;
  reason?: string | undefined;
  payload?: Record<string, unknown> | undefined;
}

export interface SelfRequestResult {
  queueId: string;
  type: "visibility_request" | "delete_request";
  status: "pending";
  createdAt: string;
}

const buildBody = (
  reason: string | undefined,
  payload: Record<string, unknown> | undefined,
): string => JSON.stringify({ reason: reason ?? null, payload: payload ?? null });

/**
 * visibility_request / delete_request を admin_member_notes に投入する。
 * 二重申請判定 (AC-6 の MVP 代替) は呼び出し側で hasPendingRequest を確認した後に呼ぶ。
 */
const appendSelfRequest = async (
  type: "visibility_request" | "delete_request",
  input: AppendSelfRequestInput,
): Promise<SelfRequestResult> => {
  const note = await adminNotes.create(input.ctx, {
    memberId: input.memberId,
    body: buildBody(input.reason, input.payload),
    createdBy: toAdminEmail(input.actorEmail),
    noteType: type,
  });
  await auditLog.append(input.ctx, {
    actorId: null,
    actorEmail: toAdminEmail(input.actorEmail) as AdminEmail,
    action: toAuditAction(`member.self.${type}`),
    targetType: "member",
    targetId: input.memberId,
    after: { noteId: note.noteId, type },
  });
  return {
    queueId: note.noteId,
    type,
    status: "pending",
    createdAt: note.createdAt,
  };
};

export const memberSelfRequestQueue = {
  hasPending: (ctx: DbCtx, memberId: MemberId, type: "visibility_request" | "delete_request") =>
    adminNotes.hasPendingRequest(ctx, memberId, type),
  appendVisibility: (input: AppendSelfRequestInput) =>
    appendSelfRequest("visibility_request", input),
  appendDelete: (input: AppendSelfRequestInput) =>
    appendSelfRequest("delete_request", input),
};

/**
 * editResponseUrl を解決する。
 * 03b で member_responses.edit_response_url に同期済の値があればそれを使う。
 * 取得不能（同期未完了 / Form 側の API 制限）なら null を返し、呼び出し側で fallbackResponderUrl を使う。
 */
export const resolveEditResponseUrl = async (
  ctx: DbCtx,
  memberId: MemberId,
): Promise<string | null> => {
  try {
    const r = await findCurrentResponse(ctx, asMemberId(memberId));
    return r?.edit_response_url ?? null;
  } catch {
    // F-11: 03b helper が throw しても fallback として null を返す
    return null;
  }
};
