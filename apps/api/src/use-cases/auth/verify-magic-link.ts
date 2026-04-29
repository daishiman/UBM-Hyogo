// 05b: Magic Link 検証 use-case (Auth.js callback から呼ばれる)
// AC-5: 期限切れ -> reason: "expired"
// AC-6: 二重使用 -> reason: "already_used"
// AC-10: identity / status 解決失敗時は session を作らない (resolve_failed)
// 不変条件 #7: SessionUser に memberId / responseId を別フィールドとして格納

import type { DbCtx } from "../../repository/_shared/db";
import { consume } from "../../repository/magicTokens";
import type { MagicTokenValue } from "../../repository/_shared/brand";
import { resolveSession, type ResolveSessionResult } from "./resolve-session";

export type VerifyMagicLinkResult =
  | { readonly ok: true; readonly user: Extract<ResolveSessionResult, { ok: true }>["user"] }
  | { readonly ok: false; readonly reason: "not_found" | "expired" | "already_used" | "resolve_failed" };

export interface VerifyMagicLinkInput {
  readonly ctx: DbCtx;
  readonly token: MagicTokenValue;
  readonly email: string;
  readonly now?: Date;
}

export async function verifyMagicLink(
  input: VerifyMagicLinkInput,
): Promise<VerifyMagicLinkResult> {
  const consumed = await consume(input.ctx, input.token, input.now ?? new Date());
  if (!consumed.ok) {
    return { ok: false, reason: consumed.reason };
  }
  // email mismatch (token に紐付いた email と request email が違う) は AC-10 / 不変条件 #7
  // session を作らない (= resolve_failed)。
  const expected = consumed.row.email.trim().toLowerCase();
  const actual = input.email.trim().toLowerCase();
  if (expected !== actual) {
    return { ok: false, reason: "resolve_failed" };
  }
  // session を組み立てる。callback が ok=true 時のみ session を発行する責務を持つ。
  const sessionResult = await resolveSession({ ctx: input.ctx, email: actual });
  if (!sessionResult.ok) {
    return { ok: false, reason: "resolve_failed" };
  }
  return { ok: true, user: sessionResult.user };
}
