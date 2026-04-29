// 05a: GET /auth/session-resolve?email=<email>
// apps/web の Auth.js signIn / jwt callback から Worker-to-Worker 経由で呼ばれる。
// 不変条件 #5 により apps/web は D1 直接アクセス禁止。本 endpoint が唯一の経路。
//
// 認証: X-Internal-Auth: <INTERNAL_AUTH_SECRET> ヘッダ必須 (internalAuth middleware)。
// 入力: email (lowercase normalize)
// 出力: { memberId, isAdmin, gateReason } (gateReason は unregistered/deleted/rules_declined/null)

import { Hono } from "hono";
import { internalAuth, type InternalAuthEnv } from "../../middleware/internal-auth";
import { ctx as makeCtx, type D1Db } from "../../repository/_shared/db";
import { findIdentityByEmail } from "../../repository/identities";
import { getStatus } from "../../repository/status";
import { isActiveAdmin } from "../../repository/adminUsers";
import {
  asMemberId,
  asResponseEmail,
  adminEmail as toAdminEmail,
} from "../../repository/_shared/brand";
import type { GateReason } from "@ubm-hyogo/shared";

export interface SessionResolveEnv extends InternalAuthEnv {
  readonly DB: D1Db;
}

const isValidEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

export const createSessionResolveRoute = (): Hono<{
  Bindings: SessionResolveEnv;
}> => {
  const app = new Hono<{ Bindings: SessionResolveEnv }>();
  app.use("*", internalAuth);

  app.get("/session-resolve", async (c) => {
    const raw = c.req.query("email");
    if (!raw) {
      return c.json({ error: "email required" }, 400);
    }
    const email = raw.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return c.json({ error: "invalid email" }, 400);
    }

    const ctx = makeCtx({ DB: c.env.DB });

    const identity = await findIdentityByEmail(ctx, asResponseEmail(email));
    if (!identity) {
      return c.json({
        memberId: null,
        isAdmin: false,
        gateReason: "unregistered" satisfies GateReason,
      });
    }

    const status = await getStatus(ctx, asMemberId(identity.member_id));
    if (status?.is_deleted === 1) {
      return c.json({
        memberId: null,
        isAdmin: false,
        gateReason: "deleted" satisfies GateReason,
      });
    }
    if (!status || status.rules_consent !== "consented") {
      return c.json({
        memberId: null,
        isAdmin: false,
        gateReason: "rules_declined" satisfies GateReason,
      });
    }

    const isAdmin = await isActiveAdmin(ctx, toAdminEmail(email));
    return c.json({
      memberId: identity.member_id,
      isAdmin,
      gateReason: null,
    });
  });

  return app;
};

export const sessionResolveRoute = createSessionResolveRoute();
