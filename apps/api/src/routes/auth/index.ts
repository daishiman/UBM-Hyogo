// 05b: /auth/* router (apps/api Hono)
// AC-1〜AC-10 を満たすルーティング
// 不変条件 #5: D1 アクセスは use-case / repository に閉じる（route から直接 DB を触らない）
// 不変条件 #9: /no-access には依存しない。状態は body の state で表現する。

import { Hono } from "hono";
import type { D1Db } from "../../repository/_shared/db";
import { ctx as makeCtx } from "../../repository/_shared/db";
import { magicTokenValue, type MagicTokenValue } from "../../repository/_shared/brand";
import {
  MagicLinkRequestZ,
  MagicLinkResponseZ,
  GateStateResponseZ,
  VerifyMagicLinkRequestZ,
  VerifyMagicLinkResponseZ,
  ResolveSessionRequestZ,
  ResolveSessionResponseZ,
  EmailZ,
  type MagicLinkResponse,
  type GateStateResponse,
  type VerifyMagicLinkResponse,
  type ResolveSessionResponse,
} from "./schemas";
import { resolveGateState } from "../../use-cases/auth/resolve-gate-state";
import { issueMagicLink } from "../../use-cases/auth/issue-magic-link";
import { verifyMagicLink } from "../../use-cases/auth/verify-magic-link";
import { resolveSession } from "../../use-cases/auth/resolve-session";
import {
  rateLimitPostMagicLink,
  rateLimitGetGateState,
} from "../../middleware/rate-limit-magic-link";
import type { MailSender } from "../../services/mail/magic-link-mailer";

export interface AuthRouteEnv {
  readonly DB: D1Database;
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly AUTH_URL?: string;
  readonly MAIL_FROM_ADDRESS?: string;
}

export interface AuthRouteDeps {
  // env から sender を組み立てる factory。リクエスト毎に呼ばれる。
  // テストや dev フォールバック sender を入れ替えるための拡張点。
  readonly resolveMailSender: (env: AuthRouteEnv) => MailSender;
  readonly buildMagicLinkUrl?: (token: MagicTokenValue, email: string, env: AuthRouteEnv) => string;
  readonly ttlSec?: number;
  readonly now?: () => Date;
}

const DEFAULT_TTL_SEC = 15 * 60;
const DEFAULT_AUTH_URL = "http://localhost:3000";
const DEFAULT_MAIL_FROM = "no-reply@ubm-hyogo.local";

const defaultBuildMagicLinkUrl = (
  token: MagicTokenValue,
  email: string,
  env: AuthRouteEnv,
): string => {
  const base = (env.AUTH_URL ?? DEFAULT_AUTH_URL).replace(/\/$/, "");
  const search = new URLSearchParams({ token, email });
  return `${base}/api/auth/callback/email?${search.toString()}`;
};

export const createAuthRoute = (deps: AuthRouteDeps) => {
  const ttlSec = deps.ttlSec ?? DEFAULT_TTL_SEC;
  const buildUrl = deps.buildMagicLinkUrl ?? defaultBuildMagicLinkUrl;
  const app = new Hono<{ Bindings: AuthRouteEnv }>();

  // POST /auth/magic-link
  app.post("/magic-link", rateLimitPostMagicLink, async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = MagicLinkRequestZ.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_REQUEST", issues: parsed.error.issues },
        400,
      );
    }
    const ctx = makeCtx({ DB: c.env.DB });
    const result = await issueMagicLink({
      ctx,
      email: parsed.data.email,
      ttlSec,
      mail: {
        sender: deps.resolveMailSender(c.env),
        fromAddress: c.env.MAIL_FROM_ADDRESS ?? DEFAULT_MAIL_FROM,
        buildLinkUrl: (token, email) => buildUrl(token, email, c.env),
      },
      ...(deps.now !== undefined ? { now: deps.now() } : {}),
    });
    if (result.state === "mail_failed") {
      return c.json({ code: "MAIL_FAILED", message: result.errorMessage }, 502);
    }
    const body: MagicLinkResponse = { state: result.state };
    return c.json(MagicLinkResponseZ.parse(body));
  });

  // GET /auth/gate-state
  app.get("/gate-state", rateLimitGetGateState, async (c) => {
    const emailRaw = c.req.query("email");
    const parsed = EmailZ.safeParse(emailRaw);
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_REQUEST", issues: parsed.error.issues },
        400,
      );
    }
    const ctx = makeCtx({ DB: c.env.DB });
    const gate = await resolveGateState(ctx, parsed.data);
    const body: GateStateResponse = { state: gate.state };
    return c.json(GateStateResponseZ.parse(body));
  });

  // POST /auth/magic-link/verify (apps/web Auth.js callback から server-to-server で呼ぶ)
  app.post("/magic-link/verify", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = VerifyMagicLinkRequestZ.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_REQUEST", issues: parsed.error.issues },
        400,
      );
    }
    const ctx = makeCtx({ DB: c.env.DB });
    const result = await verifyMagicLink({
      ctx,
      token: magicTokenValue(parsed.data.token),
      email: parsed.data.email,
      ...(deps.now !== undefined ? { now: deps.now() } : {}),
    });
    if (!result.ok) {
      const body: VerifyMagicLinkResponse = { ok: false, reason: result.reason };
      // 401 で返す: callback 側が /login?error=... へ redirect する
      return c.json(VerifyMagicLinkResponseZ.parse(body), 401);
    }
    const body: VerifyMagicLinkResponse = { ok: true, user: result.user };
    return c.json(VerifyMagicLinkResponseZ.parse(body));
  });

  // POST /auth/resolve-session (Auth.js JWT callback 共有)
  app.post("/resolve-session", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = ResolveSessionRequestZ.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_REQUEST", issues: parsed.error.issues },
        400,
      );
    }
    const ctx = makeCtx({ DB: c.env.DB });
    const result = await resolveSession({ ctx, email: parsed.data.email });
    if (!result.ok) {
      const body: ResolveSessionResponse = { ok: false, reason: result.reason };
      return c.json(ResolveSessionResponseZ.parse(body), 401);
    }
    const body: ResolveSessionResponse = { ok: true, user: result.user };
    return c.json(ResolveSessionResponseZ.parse(body));
  });

  return app;
};
