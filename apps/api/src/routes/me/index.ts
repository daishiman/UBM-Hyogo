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
  MePhotoUploadAcceptedZ,
  type MeSessionResponse,
  type MeProfileResponse,
  type MeQueueAcceptedResponse,
  type MeAttendancePageResponse,
} from "./schemas";
// issue-1031: member self photo upload/delete
import {
  getMemberPhoto,
  upsertMemberPhoto,
  deleteMemberPhoto,
} from "../../repository/memberPhotos";
import {
  MEMBER_PHOTO_ALLOWED_MIME,
  MEMBER_PHOTO_MAX_BYTES,
  MEMBER_PHOTO_OBJECT_KEY,
  MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  presignMemberPhotoGetUrl,
} from "../../lib/r2/member-photo-presign";
import type { DbCtx } from "../../repository/_shared/db";
import type { MemberId } from "../../repository/_shared/brand";
import { adminEmail as toAdminEmail, auditAction } from "../../repository/_shared/brand";
import { buildMemberProfile } from "../../repository/_shared/builder";
import {
  createAttendanceProvider,
  decodeAttendanceCursor,
  ATTENDANCE_PAGE_DEFAULT_LIMIT,
  ATTENDANCE_PAGE_MAX_LIMIT,
} from "../../repository/attendance";
import {
  attendanceProviderMiddleware,
  writeTagNoteProviderMiddleware,
  type RepositoryProviderVariables,
} from "../../middleware/repository-providers";
import {
  requireProvider,
  type WriteTagNoteProviderCtx,
} from "../../repository/_shared/provider-context";
import {
  memberSelfRequestQueue,
  resolveEditResponseUrl,
  getPendingRequestsForMember,
} from "./services";

export interface MeRouteEnv extends SessionGuardEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly RESPONDER_URL?: string;
  // issue-1031: self-upload 用 R2 binding / presign secrets（admin route と同名キー）。
  readonly MEMBER_PHOTOS?: R2Bucket;
  readonly R2_ACCOUNT_ID?: string;
  readonly R2_ACCESS_KEY_ID?: string;
  readonly R2_SECRET_ACCESS_KEY?: string;
}

export interface MeRouteDeps {
  resolveSession: SessionResolver;
}

const RESPONDER_URL_FALLBACK =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

const pickResponderUrl = (env: MeRouteEnv): string =>
  env.RESPONDER_URL ?? env.GOOGLE_FORM_RESPONDER_URL ?? RESPONDER_URL_FALLBACK;

// issue-1031: /me/profile の photoUrl fail-soft 解決（admin route の resolvePhotoUrl と同ロジック）。
// invariant #4 整合: member_photos は admin-managed data（Google Form schema 外）であり、
// invariant #4「Form 本文編集禁止」の対象外。photo は本人直接 mutate を許容する（Phase 2 §2.2）。
const resolveMyPhotoUrl = async (
  env: MeRouteEnv,
  db: DbCtx,
  memberId: MemberId,
): Promise<string | undefined> => {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return undefined;
  }
  const photo = await getMemberPhoto(db, memberId);
  if (!photo) return undefined;
  const bucketName = env.MEMBER_PHOTOS
    ? env.ENVIRONMENT === "production"
      ? "ubm-hyogo-member-photos-prod"
      : "ubm-hyogo-member-photos-staging"
    : null;
  if (!bucketName) return undefined;
  const url = await presignMemberPhotoGetUrl(
    {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: bucketName,
    },
    photo.objectKey,
    MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  );
  return url ?? undefined;
};

export const createMeRoute = (deps: MeRouteDeps) => {
  const app = new Hono<{
    Bindings: MeRouteEnv;
    Variables: SessionGuardVariables & RepositoryProviderVariables;
  }>();

  // 全 /me/* に session 必須
  app.use("*", sessionGuard({ resolveSession: deps.resolveSession }));
  // session 確定後に repository provider を bind（issue-371）
  app.use("*", attendanceProviderMiddleware);
  app.use("*", writeTagNoteProviderMiddleware);

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
    const providerCtx: WriteTagNoteProviderCtx = {
      ...ctx,
      var: {
        adminNotesProvider: requireProvider(c.var.adminNotesProvider, "adminNotesProvider"),
        auditLogProvider: requireProvider(c.var.auditLogProvider, "auditLogProvider"),
        notificationOutboxProvider: requireProvider(
          c.var.notificationOutboxProvider,
          "notificationOutboxProvider",
        ),
        tagDefinitionsProvider: requireProvider(
          c.var.tagDefinitionsProvider,
          "tagDefinitionsProvider",
        ),
        tagQueueProvider: requireProvider(c.var.tagQueueProvider, "tagQueueProvider"),
        memberTagsProvider: requireProvider(c.var.memberTagsProvider, "memberTagsProvider"),
      },
    };
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
    const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId);
    // issue-1031: presign で photoUrl を fail-soft 同梱（失敗・row 無なら省略・200 維持）。
    const photoUrl = await resolveMyPhotoUrl(c.env, ctx, user.memberId).catch(
      () => undefined,
    );
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
      ...(photoUrl !== undefined ? { photoUrl } : {}),
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
      const providerCtx: WriteTagNoteProviderCtx = {
        ...ctx,
        var: {
          adminNotesProvider: requireProvider(c.var.adminNotesProvider, "adminNotesProvider"),
          auditLogProvider: requireProvider(c.var.auditLogProvider, "auditLogProvider"),
          notificationOutboxProvider: requireProvider(
            c.var.notificationOutboxProvider,
            "notificationOutboxProvider",
          ),
          tagDefinitionsProvider: requireProvider(
            c.var.tagDefinitionsProvider,
            "tagDefinitionsProvider",
          ),
          tagQueueProvider: requireProvider(c.var.tagQueueProvider, "tagQueueProvider"),
          memberTagsProvider: requireProvider(c.var.memberTagsProvider, "memberTagsProvider"),
        },
      };
      const raw = await c.req.json().catch(() => null);
      const parsed = MeVisibilityRequestBodyZ.safeParse(raw);
      if (!parsed.success) {
        return c.json(
          { code: "INVALID_REQUEST", issues: parsed.error.issues },
          422,
        );
      }
      const pending = await memberSelfRequestQueue.hasPending(
        providerCtx,
        user.memberId,
        "visibility_request",
      );
      if (pending) {
        return c.json({ code: "DUPLICATE_PENDING_REQUEST" }, 409);
      }
      const result = await memberSelfRequestQueue.appendVisibility({
        ctx: providerCtx,
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
      const providerCtx: WriteTagNoteProviderCtx = {
        ...ctx,
        var: {
          adminNotesProvider: requireProvider(c.var.adminNotesProvider, "adminNotesProvider"),
          auditLogProvider: requireProvider(c.var.auditLogProvider, "auditLogProvider"),
          notificationOutboxProvider: requireProvider(
            c.var.notificationOutboxProvider,
            "notificationOutboxProvider",
          ),
          tagDefinitionsProvider: requireProvider(
            c.var.tagDefinitionsProvider,
            "tagDefinitionsProvider",
          ),
          tagQueueProvider: requireProvider(c.var.tagQueueProvider, "tagQueueProvider"),
          memberTagsProvider: requireProvider(c.var.memberTagsProvider, "memberTagsProvider"),
        },
      };
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
        providerCtx,
        user.memberId,
        "delete_request",
      );
      if (pending) {
        return c.json({ code: "DUPLICATE_PENDING_REQUEST" }, 409);
      }
      const result = await memberSelfRequestQueue.appendDelete({
        ctx: providerCtx,
        memberId: user.memberId,
        actorEmail: user.email,
        reason: parsed.data.reason,
      });
      const body: MeQueueAcceptedResponse = result;
      return c.json(MeQueueAcceptedResponseZ.parse(body), 202);
    },
  );

  // POST /me/photo — member self-upload
  // invariant #11: path に :memberId を含めず session.user.memberId のみで R2 key / D1 row を解決。
  // invariant #4: member_photos は admin-managed data（Form 本文外）→ 本人直接 mutate を許容（Phase 2 §2.2）。
  // middleware: sessionGuard（/me/* 全体）→ requireRulesConsent（AC-7）→ rateLimitSelfRequest（AC-8）。
  app.post("/photo", requireRulesConsent, rateLimitSelfRequest, async (c) => {
    const user = c.get("user");
    const memberId = user.memberId;
    const ctx = c.get("ctx");

    // multipart body（query / body に他人の memberId を混ぜても一切参照しない＝AC-2）。
    const formData = await c.req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || !(file instanceof File)) {
      return c.json({ ok: false, error: "file field required" }, 400);
    }

    // MIME 検証（AC-6・server 側が最終判定）。
    if (!(MEMBER_PHOTO_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return c.json({ ok: false, error: "unsupported media type" }, 415);
    }

    // バイト数検証（AC-6）。
    const buf = await file.arrayBuffer();
    if (buf.byteLength === 0) {
      return c.json({ ok: false, error: "empty file" }, 400);
    }
    if (buf.byteLength > MEMBER_PHOTO_MAX_BYTES) {
      return c.json({ ok: false, error: "file too large" }, 413);
    }

    // R2 binding が無い場合は明示的に 503（D1 を触る前に返す）。
    if (!c.env.MEMBER_PHOTOS) {
      return c.json({ ok: false, error: "R2 binding missing" }, 503);
    }

    const objectKey = MEMBER_PHOTO_OBJECT_KEY(memberId);
    await c.env.MEMBER_PHOTOS.put(objectKey, buf, {
      httpMetadata: { contentType: file.type },
    });

    // D1 upsert（source='self'）。
    // issue-1030: member 本人 upload は client 側 thumb 生成経路を持たないため
    //   thumb 系メタは null・processingStatus は original_fallback で保存する（admin の thumb 無しケースと同一扱い）。
    await upsertMemberPhoto(ctx, {
      memberId,
      objectKey,
      contentType: file.type,
      byteSize: buf.byteLength,
      thumbObjectKey: null,
      thumbByteSize: null,
      contentHash: null,
      processingStatus: "original_fallback",
      uploadedBy: user.email,
      source: "self",
    });

    // audit（actor = session email。admin 系 "admin.member.photo_*" とは別 action 名で区別）。
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: null,
      actorEmail: toAdminEmail(user.email),
      action: auditAction("member.photo_uploaded"),
      targetType: "member",
      targetId: memberId,
      after: {
        objectKey,
        contentType: file.type,
        byteSize: buf.byteLength,
        source: "self",
      },
    });

    return c.json(MePhotoUploadAcceptedZ.parse({ ok: true }));
  });

  // DELETE /me/photo — member self-delete（同意ゲート不要＝自分の写真撤去は自由・sessionGuard のみ）。
  app.delete("/photo", async (c) => {
    const user = c.get("user");
    const memberId = user.memberId;
    const ctx = c.get("ctx");

    const photo = await getMemberPhoto(ctx, memberId);
    if (!photo) {
      return c.json({ ok: false, error: "photo not found" }, 404);
    }

    // R2 delete（binding 有時のみ。無くても D1 は削除する）。
    if (c.env.MEMBER_PHOTOS) {
      await c.env.MEMBER_PHOTOS.delete(photo.objectKey);
    }
    await deleteMemberPhoto(ctx, memberId);

    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: null,
      actorEmail: toAdminEmail(user.email),
      action: auditAction("member.photo_deleted"),
      targetType: "member",
      targetId: memberId,
      before: { objectKey: photo.objectKey },
    });

    return c.json({ ok: true });
  });

  return app;
};
