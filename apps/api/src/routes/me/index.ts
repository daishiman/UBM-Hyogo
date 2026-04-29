// 04b: /me/* member self-service router
// 不変条件 #4: 本人プロフィール本文を D1 で編集する route を一切 mount しない。PATCH 系は無し。
// 不変条件 #11: path に :memberId を一切含めない。session.user.memberId のみを参照。
// 不変条件 #12: 全 GET response 型に admin_member_notes 由来のキーが現れないことを zod schema (strict) で保証。

import { Hono } from "hono";
import {
  sessionGuard,
  requireRulesConsent,
  type SessionGuardEnv,
  type SessionGuardVariables,
  type SessionResolver,
} from "../../middleware/session-guard";
import { rateLimitSelfRequest } from "../../middleware/rate-limit-self-request";
import {
  MeSessionResponseZ,
  MeProfileResponseZ,
  MeQueueAcceptedResponseZ,
  MeVisibilityRequestBodyZ,
  MeDeleteRequestBodyZ,
  type MeSessionResponse,
  type MeProfileResponse,
  type MeQueueAcceptedResponse,
} from "./schemas";
import { buildMemberProfile } from "../../repository/_shared/builder";
import {
  memberSelfRequestQueue,
  resolveEditResponseUrl,
} from "./services";

export interface MeRouteEnv extends SessionGuardEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly RESPONDER_URL?: string;
}

export interface MeRouteDeps {
  resolveSession: SessionResolver;
}

const RESPONDER_URL_FALLBACK =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

const pickResponderUrl = (env: MeRouteEnv): string =>
  env.RESPONDER_URL ?? env.GOOGLE_FORM_RESPONDER_URL ?? RESPONDER_URL_FALLBACK;

export const createMeRoute = (deps: MeRouteDeps) => {
  const app = new Hono<{ Bindings: MeRouteEnv; Variables: SessionGuardVariables }>();

  // 全 /me/* に session 必須
  app.use("*", sessionGuard({ resolveSession: deps.resolveSession }));

  // GET /me — SessionUser
  app.get("/", (c) => {
    const user = c.get("user");
    const body: MeSessionResponse = {
      user: {
        memberId: user.memberId,
        responseId: user.responseId,
        email: user.email,
        isAdmin: user.isAdmin,
        // SessionUserZ.authGateState は input/sent を除外した nullable 列挙。
        // /me では active|rules_declined|deleted のいずれかを返す（deleted は middleware で 410 弾き済）。
        authGateState: user.authGateState,
      },
      authGateState: user.authGateState,
    };
    return c.json(MeSessionResponseZ.parse(body));
  });

  // GET /me/profile — MemberProfile + statusSummary + editResponseUrl
  app.get("/profile", async (c) => {
    const user = c.get("user");
    const ctx = c.get("ctx");
    const profile = await buildMemberProfile(ctx, user.memberId);
    if (!profile) {
      // identity / response が見つからない (同期未完了など)
      return c.json({ code: "PROFILE_UNAVAILABLE" }, 404);
    }
    const editUrl = await resolveEditResponseUrl(ctx, user.memberId);
    const body: MeProfileResponse = {
      profile,
      statusSummary: {
        publicConsent: profile.publicConsent,
        rulesConsent: profile.rulesConsent,
        publishState: profile.publishState,
        // sessionGuard で is_deleted=1 を 410 で弾いているため、ここでは常に false (#4)
        isDeleted: false,
      },
      editResponseUrl: editUrl,
      fallbackResponderUrl: pickResponderUrl(c.env),
    };
    return c.json(MeProfileResponseZ.parse(body));
  });

  // POST /me/visibility-request
  app.post(
    "/visibility-request",
    requireRulesConsent,
    rateLimitSelfRequest,
    async (c) => {
      const user = c.get("user");
      const ctx = c.get("ctx");
      const raw = await c.req.json().catch(() => null);
      const parsed = MeVisibilityRequestBodyZ.safeParse(raw);
      if (!parsed.success) {
        return c.json(
          { code: "INVALID_REQUEST", issues: parsed.error.issues },
          422,
        );
      }
      const pending = await memberSelfRequestQueue.hasPending(
        ctx,
        user.memberId,
        "visibility_request",
      );
      if (pending) {
        return c.json({ code: "DUPLICATE_PENDING_REQUEST" }, 409);
      }
      const result = await memberSelfRequestQueue.appendVisibility({
        ctx,
        memberId: user.memberId,
        actorEmail: user.email,
        reason: parsed.data.reason,
        payload: { desiredState: parsed.data.desiredState },
      });
      const body: MeQueueAcceptedResponse = result;
      return c.json(MeQueueAcceptedResponseZ.parse(body), 202);
    },
  );

  // POST /me/delete-request
  app.post(
    "/delete-request",
    requireRulesConsent,
    rateLimitSelfRequest,
    async (c) => {
      const user = c.get("user");
      const ctx = c.get("ctx");
      const raw = await c.req.json().catch(() => null);
      // 空 body を許容: {} とみなす
      const parsed = MeDeleteRequestBodyZ.safeParse(raw ?? {});
      if (!parsed.success) {
        return c.json(
          { code: "INVALID_REQUEST", issues: parsed.error.issues },
          422,
        );
      }
      const pending = await memberSelfRequestQueue.hasPending(
        ctx,
        user.memberId,
        "delete_request",
      );
      if (pending) {
        return c.json({ code: "DUPLICATE_PENDING_REQUEST" }, 409);
      }
      const result = await memberSelfRequestQueue.appendDelete({
        ctx,
        memberId: user.memberId,
        actorEmail: user.email,
        reason: parsed.data.reason,
      });
      const body: MeQueueAcceptedResponse = result;
      return c.json(MeQueueAcceptedResponseZ.parse(body), 202);
    },
  );

  return app;
};
