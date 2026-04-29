// 05b: /auth/* の zod schema
// 不変条件 #2: rules_consent / public_consent 名称を維持
// 不変条件 #7: SessionUser は memberId と responseId を別フィールドで保持
// 認可境界: gate-state レスポンスに memberId を含めない（leakage 防止）

import { z } from "zod";

export const EmailZ = z.string().trim().toLowerCase().email().max(254);

// AuthGateState（API 表現）: input/sent は UI 内部状態のため API は返さない。
// ok は POST /auth/magic-link を呼べば sent になる「ログイン可能」状態。
export const ApiGateStateZ = z.enum([
  "ok",
  "unregistered",
  "rules_declined",
  "deleted",
]);
export type ApiGateState = z.infer<typeof ApiGateStateZ>;

// POST /auth/magic-link
export const MagicLinkRequestZ = z.object({ email: EmailZ }).strict();
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestZ>;

export const MagicLinkResponseZ = z
  .object({
    state: z.enum(["sent", "unregistered", "rules_declined", "deleted"]),
  })
  .strict();
export type MagicLinkResponse = z.infer<typeof MagicLinkResponseZ>;

// GET /auth/gate-state
export const GateStateResponseZ = z
  .object({ state: ApiGateStateZ })
  .strict();
export type GateStateResponse = z.infer<typeof GateStateResponseZ>;

// POST /auth/magic-link/verify  (apps/web Auth.js callback から呼ばれる)
export const VerifyMagicLinkRequestZ = z
  .object({
    token: z.string().regex(/^[0-9a-f]{64}$/),
    email: EmailZ,
  })
  .strict();
export type VerifyMagicLinkRequest = z.infer<typeof VerifyMagicLinkRequestZ>;

const SessionUserResponseZ = z
  .object({
    email: z.string().email(),
    memberId: z.string().min(1),
    responseId: z.string().min(1),
    isAdmin: z.boolean(),
    authGateState: z.enum(["active", "rules_declined", "deleted"]),
  })
  .strict();
export type SessionUserResponse = z.infer<typeof SessionUserResponseZ>;

export const VerifyMagicLinkResponseZ = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), user: SessionUserResponseZ }).strict(),
  z
    .object({
      ok: z.literal(false),
      reason: z.enum(["not_found", "expired", "already_used", "resolve_failed"]),
    })
    .strict(),
]);
export type VerifyMagicLinkResponse = z.infer<typeof VerifyMagicLinkResponseZ>;

// POST /auth/resolve-session  (Auth.js JWT callback 共有)
export const ResolveSessionRequestZ = z.object({ email: EmailZ }).strict();
export type ResolveSessionRequest = z.infer<typeof ResolveSessionRequestZ>;

export const ResolveSessionResponseZ = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), user: SessionUserResponseZ }).strict(),
  z
    .object({
      ok: z.literal(false),
      reason: z.enum(["unregistered", "rules_declined", "deleted"]),
    })
    .strict(),
]);
export type ResolveSessionResponse = z.infer<typeof ResolveSessionResponseZ>;
