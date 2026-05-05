// 04b: member self-service API の session 必須 middleware
// 不変条件 #11: path に :memberId を取らず、session 由来の memberId のみを context.user に注入する。
// 不変条件 #5: D1 アクセスは apps/api 内 repository に閉じる。
// 不変条件 #9: deleted / rules_declined は authGateState で表現し、/no-access 専用画面に依存しない。
//
// Auth.js provider 設定 (05a/b) は本タスクのスコープ外。本 middleware は
//   "Cookie/JWT を読んで SessionUser を解決する hook" を依存注入で受け取り、
//   テストでは fake hook を渡せるようにする。

import type { MiddlewareHandler } from "hono";
import type { D1Db, DbCtx } from "../repository/_shared/db";
import { ctx as makeCtx } from "../repository/_shared/db";
import {
  asMemberId,
  asResponseId,
  type MemberId,
  type ResponseId,
} from "../repository/_shared/brand";
import { findIdentityByMemberId } from "../repository/identities";
import { getStatus } from "../repository/status";
import { findByEmail as findAdminByEmail } from "../repository/adminUsers";
import { adminEmail as toAdminEmail } from "../repository/_shared/brand";

export type AuthGateState = "active" | "rules_declined" | "deleted";

export interface SessionUser {
  email: string;
  memberId: MemberId;
  responseId: ResponseId;
  isAdmin: boolean;
  authGateState: AuthGateState;
}

/**
 * Auth.js (05a/b) が提供する session 解決 hook の型。
 * - 戻り値が null なら未ログイン → 401。
 * - { email, memberId } を返すと、本 middleware が status / admin を補強して context.user を作る。
 */
export type SessionResolver = (
  request: Request,
  env?: SessionGuardEnv,
) => Promise<{ email: string; memberId: string } | null>;

export interface SessionGuardEnv {
  readonly DB: D1Database;
  readonly ENVIRONMENT?: "production" | "staging" | "development";
}

export interface SessionGuardDeps {
  resolveSession: SessionResolver;
}

export type SessionGuardVariables = {
  user: SessionUser;
  ctx: DbCtx;
};

const errorBody = (code: string, extra?: Record<string, unknown>) => ({
  code,
  ...(extra ?? {}),
});

/**
 * GET /me 系で利用する session 必須 middleware。
 * - session 未解決 → 401 UNAUTHENTICATED
 * - member_status.is_deleted=1 → 410 DELETED + authGateState=deleted
 * - rules_consent != consented → 200 で次に進めつつ authGateState=rules_declined を context に積む
 *   （POST 系は別途 requireRulesConsent guard を組み合わせて 403 にする）
 */
export const sessionGuard = (
  deps: SessionGuardDeps,
): MiddlewareHandler<{
  Bindings: SessionGuardEnv;
  Variables: SessionGuardVariables;
}> => {
  return async (c, next) => {
    const session = await deps.resolveSession(c.req.raw, c.env);
    if (!session) {
      return c.json(errorBody("UNAUTHENTICATED"), 401);
    }
    const ctx = makeCtx({ DB: c.env.DB });
    const memberId = asMemberId(session.memberId);

    const [identity, status] = await Promise.all([
      findIdentityByMemberId(ctx, memberId),
      getStatus(ctx, memberId),
    ]);

    if (!identity || !status) {
      // session 由来の memberId が D1 と整合しない (削除直後・同期未完了 等)
      // → 401 として扱い、memberId を絶対に response に出さない (#11)
      return c.json(errorBody("UNAUTHENTICATED"), 401);
    }

    if (status.is_deleted === 1) {
      return c.json(
        errorBody("DELETED", { authGateState: "deleted" satisfies AuthGateState }),
        410,
      );
    }

    const authGateState: AuthGateState =
      status.rules_consent === "consented" ? "active" : "rules_declined";

    const adminRow = await findAdminByEmail(ctx, toAdminEmail(session.email));
    const isAdmin = adminRow !== null && adminRow.active;

    const user: SessionUser = {
      email: session.email,
      memberId,
      responseId: asResponseId(identity.current_response_id),
      isAdmin,
      authGateState,
    };

    c.set("user", user);
    c.set("ctx", ctx);
    await next();
    return;
  };
};

/**
 * POST 系 (/me/visibility-request, /me/delete-request) で利用する rules_consent 必須 guard。
 * sessionGuard 後に重ねて使う。
 */
export const requireRulesConsent: MiddlewareHandler<{
  Bindings: SessionGuardEnv;
  Variables: SessionGuardVariables;
}> = async (c, next) => {
  const user = c.get("user");
  if (!user || user.authGateState !== "active") {
    return c.json(errorBody("RULES_NOT_ACCEPTED"), 403);
  }
  await next();
  return;
};
