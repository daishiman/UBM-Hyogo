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
  MeAttendancePageResponseZ,
  MeVisibilityRequestBodyZ,
  MeDeleteRequestBodyZ,
  type MeSessionResponse,
  type MeProfileResponse,
  type MeQueueAcceptedResponse,
  type MeAttendancePageResponse,
} from "./schemas";
import { buildMemberProfile } from "../../repository/_shared/builder";
import {
  createAttendanceProvider,
  decodeAttendanceCursor,
  ATTENDANCE_PAGE_DEFAULT_LIMIT,
  ATTENDANCE_PAGE_MAX_LIMIT,
} from "../../repository/attendance";
import {
  attendanceProviderMiddleware,
  type RepositoryProviderVariables,
} from "../../middleware/repository-providers";
import {
  memberSelfRequestQueue,
  resolveEditResponseUrl,
  getPendingRequestsForMember,
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
  const app = new Hono<{
    Bindings: MeRouteEnv;
    Variables: SessionGuardVariables & RepositoryProviderVariables;
  }>();

  // 全 /me/* に session 必須
  app.use("*", sessionGuard({ resolveSession: deps.resolveSession }));
  // session 確定後に repository provider を bind（issue-371）
  app.use("*", attendanceProviderMiddleware);

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
    const profile = await buildMemberProfile(
      { ...ctx, var: { attendanceProvider: c.var.attendanceProvider } },
      user.memberId,
      // issue-372: 直近 N 件 + cursor。先頭ページは default limit。
      { attendancePage: { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT } },
    );
    if (!profile) {
      // identity / response が見つからない (同期未完了など)
      return c.json({ code: "PROFILE_UNAVAILABLE" }, 404);
    }
    const editUrl = await resolveEditResponseUrl(ctx, user.memberId);
    const pendingRequests = await getPendingRequestsForMember(ctx, user.memberId);
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
      pendingRequests,
    };
    return c.json(MeProfileResponseZ.parse(body));
  });

  // GET /me/attendance — issue-372: 出席履歴ページング継続取得
  app.get("/attendance", async (c) => {
    const user = c.get("user");
    const ctx = c.get("ctx");

    const limitRaw = c.req.query("limit");
    let limit: number | undefined;
    if (limitRaw !== undefined && limitRaw !== "") {
      const n = Number(limitRaw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        return c.json({ code: "INVALID_LIMIT" }, 400);
      }
      limit = n > ATTENDANCE_PAGE_MAX_LIMIT ? ATTENDANCE_PAGE_MAX_LIMIT : n;
    }

    const cursorRaw = c.req.query("cursor");
    let cursor: ReturnType<typeof decodeAttendanceCursor> = null;
    if (cursorRaw !== undefined && cursorRaw !== "") {
      cursor = decodeAttendanceCursor(cursorRaw);
      if (!cursor) {
        return c.json({ code: "INVALID_CURSOR" }, 400);
      }
    }

    const provider = createAttendanceProvider(ctx);
    const opts: { limit?: number; cursor?: NonNullable<typeof cursor> } = {};
    if (limit !== undefined) opts.limit = limit;
    if (cursor) opts.cursor = cursor;
    const page = await provider.findByMemberId(user.memberId, opts);
    const body: MeAttendancePageResponse = {
      records: page.records.map((r) => ({
        sessionId: r.sessionId,
        title: r.title,
        heldOn: r.heldOn,
      })),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
    return c.json(MeAttendancePageResponseZ.parse(body));
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
