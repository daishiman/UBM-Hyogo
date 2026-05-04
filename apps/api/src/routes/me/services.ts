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
import type { PendingRequests } from "./schemas";

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
 * 06b-followup-001 (#428): server-side pending request の取得。
 * `/me/profile` の reload 永続性のため、最新の pending 申請を visibility / delete に振り分ける。
 * 該当 type の pending が複数あった場合は最新 1 件 (created_at DESC) を採用する。
 * desiredState は body JSON に格納された `payload.desiredState` を使用し、
 * parse 不能なら "hidden" を fallback とする（保守的に hide 側を表示）。
 */
export const getPendingRequestsForMember = async (
  ctx: DbCtx,
  memberId: MemberId,
): Promise<PendingRequests> => {
  const visibility = await adminNotes.findLatestByMemberAndType(
    ctx,
    memberId,
    "visibility_request",
  );
  const del = await adminNotes.findLatestByMemberAndType(
    ctx,
    memberId,
    "delete_request",
  );
  const result: PendingRequests = {};
  if (visibility && visibility.requestStatus === "pending") {
    let desired: "hidden" | "public" = "hidden";
    try {
      const body = JSON.parse(visibility.body) as {
        payload?: { desiredState?: unknown };
      } | null;
      const candidate = body?.payload?.desiredState;
      if (candidate === "hidden" || candidate === "public") {
        desired = candidate;
      }
    } catch {
      // body 不正は fallback で hidden
    }
    result.visibility = {
      queueId: visibility.noteId,
      status: "pending",
      createdAt: visibility.createdAt,
      desiredState: desired,
    };
  }
  if (del && del.requestStatus === "pending") {
    result.delete = {
      queueId: del.noteId,
      status: "pending",
      createdAt: del.createdAt,
    };
  }
  return result;
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
