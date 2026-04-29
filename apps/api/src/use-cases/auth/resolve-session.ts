// 05b: Auth.js session callback で SessionUser を組み立てる use-case
// AC-10: identity 不在 / consent 未同意 / 削除済みの場合は ok=false (session 未発行)
// 不変条件 #2: rules_consent 名で参照
// 不変条件 #5: D1 アクセスは repository に閉じる
// 不変条件 #7: memberId / responseId を別フィールドで保持
// 並列 05a (Google OAuth) と共有して呼び出される。Magic Link / Google OAuth どちらの provider
// でも email を入力に session を組み立てる。

import type { DbCtx } from "../../repository/_shared/db";
import { resolveGateState } from "./resolve-gate-state";
import { isActiveAdmin } from "../../repository/adminUsers";
import { adminEmail as toAdminEmail } from "../../repository/_shared/brand";

export type SessionUserAuthGateState = "active" | "rules_declined" | "deleted";

export interface SessionUser {
  readonly email: string;
  readonly memberId: string;
  readonly responseId: string;
  readonly isAdmin: boolean;
  readonly authGateState: SessionUserAuthGateState;
}

export type ResolveSessionResult =
  | { readonly ok: true; readonly user: SessionUser }
  | {
      readonly ok: false;
      readonly reason: "unregistered" | "rules_declined" | "deleted";
    };

export interface ResolveSessionInput {
  readonly ctx: DbCtx;
  readonly email: string;
}

export async function resolveSession(
  input: ResolveSessionInput,
): Promise<ResolveSessionResult> {
  const email = input.email.trim().toLowerCase();
  const gate = await resolveGateState(input.ctx, email);
  if (gate.state === "unregistered") {
    return { ok: false, reason: "unregistered" };
  }
  if (gate.state === "deleted") {
    return { ok: false, reason: "deleted" };
  }
  if (gate.state === "rules_declined") {
    // session は発行しない。AC-10 / 不変条件 #2。
    return { ok: false, reason: "rules_declined" };
  }
  // ok: memberId / responseId が解決されている
  if (gate.memberId === null || gate.responseId === null) {
    return { ok: false, reason: "unregistered" };
  }
  const isAdmin = await isActiveAdmin(input.ctx, toAdminEmail(email));
  return {
    ok: true,
    user: {
      email,
      memberId: gate.memberId,
      responseId: gate.responseId,
      isAdmin,
      authGateState: "active",
    },
  };
}
