// 05b: Magic Link 発行 use-case
// AC-1〜AC-4: gate-state を判定し、ok のみ token 発行 + mail enqueue
// AC-8: secret はすべて引数経由で受け取り、コードに固定しない
// 不変条件 #5: D1 アクセスは repository 経由
// 不変条件 #10: mail 送信失敗時は token を DELETE して rollback

import type { DbCtx } from "../../repository/_shared/db";
import { issue as issueToken, deleteByToken } from "../../repository/magicTokens";
import { resolveGateState, type GateStateBlocked } from "./resolve-gate-state";
import {
  buildMagicLinkMessage,
  type MailSender,
} from "../../services/mail/magic-link-mailer";
import type { MagicTokenValue } from "../../repository/_shared/brand";

export type IssueMagicLinkResult =
  | { readonly state: "sent"; readonly token: MagicTokenValue }
  | { readonly state: GateStateBlocked }
  | { readonly state: "mail_failed"; readonly errorMessage: string };

export interface IssueMagicLinkInput {
  readonly ctx: DbCtx;
  readonly email: string;
  readonly ttlSec: number;
  readonly mail: {
    readonly sender: MailSender;
    readonly fromAddress: string;
    readonly buildLinkUrl: (token: MagicTokenValue, email: string) => string;
  };
  readonly now?: Date;
}

export async function issueMagicLink(
  input: IssueMagicLinkInput,
): Promise<IssueMagicLinkResult> {
  const gate = await resolveGateState(input.ctx, input.email);
  if (gate.state !== "ok") {
    return { state: gate.state };
  }
  // gate.memberId / responseId は ok のとき非 null（resolveGateState の post-condition）
  if (gate.memberId === null || gate.responseId === null) {
    // 防御的: 万一発生したら rules_declined 相当として扱う（AC-10 / 不変条件 #7）
    return { state: "rules_declined" };
  }
  const row = await issueToken(input.ctx, {
    memberId: gate.memberId,
    email: input.email.trim().toLowerCase(),
    responseId: gate.responseId,
    ttlSec: input.ttlSec,
    ...(input.now !== undefined ? { now: input.now } : {}),
  });
  const message = buildMagicLinkMessage({
    to: row.email,
    from: input.mail.fromAddress,
    magicLinkUrl: input.mail.buildLinkUrl(row.token, row.email),
    ttlMinutes: Math.max(1, Math.floor(input.ttlSec / 60)),
  });
  const result = await input.mail.sender.send(message);
  if (!result.ok) {
    // rollback: 直前に INSERT した token を削除する
    await deleteByToken(input.ctx, row.token);
    return {
      state: "mail_failed",
      errorMessage: result.errorMessage ?? "mail_send_failed",
    };
  }
  return { state: "sent", token: row.token };
}
