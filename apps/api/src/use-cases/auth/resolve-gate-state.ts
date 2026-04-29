// 05b: AuthGateState resolver
// 純関数: email -> "ok" | "unregistered" | "rules_declined" | "deleted"
// 判定優先順位: unregistered -> deleted -> rules_declined -> ok
// 不変条件 #2: rules_consent のみで判定（public_consent は判定に使わない）
// 不変条件 #3: response_email を system field として lookup key に使う
// 不変条件 #5: D1 アクセスは apps/api 内 repository に閉じる
// 不変条件 #7: response_id と member_id を別フィールドとして保持

import type { DbCtx } from "../../repository/_shared/db";
import { findIdentityByEmail } from "../../repository/identities";
import { getStatus } from "../../repository/status";
import { asMemberId, asResponseEmail } from "../../repository/_shared/brand";
import type { MemberId, ResponseId } from "../../repository/_shared/brand";

export type GateStateOk = "ok";
export type GateStateBlocked = "unregistered" | "rules_declined" | "deleted";
export type GateStateValue = GateStateOk | GateStateBlocked;

export interface ResolveGateStateResult {
  state: GateStateValue;
  // ok のときのみ memberId / responseId が解決される。それ以外は null。
  // 注: gate-state レスポンスへ memberId を露出させない（呼び出し側で除外）。
  memberId: MemberId | null;
  responseId: ResponseId | null;
}

export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

export async function resolveGateState(
  c: DbCtx,
  rawEmail: string,
): Promise<ResolveGateStateResult> {
  const email = normalizeEmail(rawEmail);
  const identity = await findIdentityByEmail(c, asResponseEmail(email));
  if (!identity) {
    return { state: "unregistered", memberId: null, responseId: null };
  }
  const memberId = asMemberId(identity.member_id);
  const status = await getStatus(c, memberId);
  // status row が無い場合は consent 未取得とみなし rules_declined
  if (!status) {
    return { state: "rules_declined", memberId: null, responseId: null };
  }
  // 削除済みは rules_consent より先に判定（誤誘導を避ける）
  if (status.is_deleted === 1) {
    return { state: "deleted", memberId: null, responseId: null };
  }
  if (status.rules_consent !== "consented") {
    return { state: "rules_declined", memberId: null, responseId: null };
  }
  return {
    state: "ok",
    memberId,
    responseId: identity.current_response_id as ResponseId,
  };
}
