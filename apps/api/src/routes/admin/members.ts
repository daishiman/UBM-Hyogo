// 04c / 06c-B: GET /admin/members, GET /admin/members/:memberId
// 12-search-tags の検索パラメータ (q / zone / tag(repeated) / sort / density / page)
// と既存 filter (published|hidden|deleted) を組合せて返す。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import {
  attendanceProviderMiddleware,
  writeTagNoteProviderMiddleware,
  type RepositoryProviderVariables,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { ctx, type DbCtx } from "../../repository/_shared/db";
import {
  asMemberId,
  asAdminId,
  adminEmail,
  auditAction,
  type MemberId,
} from "../../repository/_shared/brand";
import {
  getTagDefinitionMaster,
  listAssignedTagsForMember,
  findTagDefinitionById,
  assignTagToMemberByAdmin,
  unassignTagFromMemberByAdmin,
  getMemberDeletedFlag,
  bulkApplyMemberTagsByAdmin,
} from "../../repository/memberTags";
import { buildAdminMemberDetailView } from "../../repository/_shared/builder";
import {
  getMemberPhoto,
  upsertMemberPhoto,
  deleteMemberPhoto,
} from "../../repository/memberPhotos";
import {
  presignMemberPhotoGetUrl,
  MEMBER_PHOTO_OBJECT_KEY,
  MEMBER_PHOTO_THUMB_OBJECT_KEY,
  MEMBER_PHOTO_MAX_BYTES,
  MEMBER_PHOTO_THUMB_MAX_BYTES,
  MEMBER_PHOTO_ALLOWED_MIME,
  MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  type MemberPhotoProcessingStatus,
} from "../../lib/r2/member-photo-presign";
import {
  createAttendanceProvider,
  decodeAttendanceCursor,
  ATTENDANCE_PAGE_DEFAULT_LIMIT,
  ATTENDANCE_PAGE_MAX_LIMIT,
} from "../../repository/attendance";
import { requireProvider } from "../../repository/_shared/provider-context";
import {
  ADMIN_DENSITY_VALUES,
  ADMIN_SEARCH_LIMITS,
  ADMIN_SORT_VALUES,
  ADMIN_ZONE_VALUES,
  AdminMemberListViewZ,
  AdminMemberDetailViewZ,
  STABLE_KEY,
  type AdminDensity,
  type AdminFilter,
  type AdminSort,
  type AdminZone,
} from "@ubm-hyogo/shared";
import { normalizeIso, memberExists, type AdminRouteEnv } from "./_shared";
import { logError } from "../../lib/logger";

const ADMIN_MEMBERS_ERROR_CODE = "UBM-ADMIN-MEMBERS-500";

const FILTER_VALUES = ["published", "hidden", "deleted"] as const;

// issue-982: admin manual tag 付与の request body。
const AssignTagBodyZ = z.object({ tagId: z.string().min(1) });

// issue-1036 / 不変条件 #13 第3経路: bulk member tag assign/unassign の body。
const BulkTagBodyZ = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(200),
  tagIds: z.array(z.string().min(1)).min(1).max(50),
  op: z.enum(["assign", "unassign"]),
});

type ConsentValue = "consented" | "declined" | "unknown";
type PublishStateValue = "public" | "member_only" | "hidden";

const normalizeConsent = (v: string | null | undefined): ConsentValue =>
  v === "consented" || v === "declined" ? v : "unknown";

const normalizePublishState = (
  v: string | null | undefined,
): PublishStateValue => {
  if (v === "public" || v === "published") return "public";
  if (v === "hidden" || v === "private") return "hidden";
  return "member_only";
};
const isOneOf = <T extends readonly string[]>(
  value: string,
  values: T,
): value is T[number] => (values as readonly string[]).includes(value);

const normalizeQ = (raw: string): string =>
  raw.trim().replace(/\s+/g, " ");

interface MemberListRow {
  member_id: string;
  response_email: string;
  last_submitted_at: string;
  answers_json: string | null;
  tags_json: string | null;
  public_consent: string | null;
  rules_consent: string | null;
  publish_state: string | null;
  is_deleted: number | null;
}

const readString = (src: Record<string, unknown>, key: string): string | undefined => {
  const v = src[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
};

const readNullableString = (
  src: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  const v = src[key];
  if (v === null) return null;
  return typeof v === "string" && v.length > 0 ? v : undefined;
};

const parseTagsJson = (raw: string | null): Array<{ code: string; label: string }> => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (entry && typeof entry === "object") {
        const rec = entry as Record<string, unknown>;
        const code = rec.code;
        const label = rec.label;
        if (typeof code === "string" && typeof label === "string") {
          return [{ code, label }];
        }
      }
      return [];
    });
  } catch {
    return [];
  }
};

const filterToSql = (filter?: AdminFilter): string => {
  if (filter === "published") {
    return "COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') IN ('public', 'published')";
  }
  if (filter === "hidden") {
    return "COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') IN ('hidden', 'private')";
  }
  if (filter === "deleted") {
    return "COALESCE(ms.is_deleted, 0) = 1";
  }
  return "1=1";
};

interface ParsedSearch {
  filter: AdminFilter | undefined;
  q: string;
  zone: AdminZone;
  tags: string[];
  sort: AdminSort;
  density: AdminDensity;
  page: number;
}

const parseSearchOrError = (
  query: Record<string, string | undefined>,
  rawQueries: { tag: string[] },
): { ok: true; value: ParsedSearch } | { ok: false; status: 400 | 422; error: string } => {
  // filter: 旧 contract 互換のため空は undefined（全件）。値がある場合のみ enum 検証
  let filter: ParsedSearch["filter"] = undefined;
  if (query.filter !== undefined && query.filter !== "") {
    if (!isOneOf(query.filter, FILTER_VALUES)) {
      return { ok: false, status: 400, error: "invalid filter" };
    }
    filter = query.filter;
  }

  const qRaw = query.q ?? "";
  if (qRaw.length > ADMIN_SEARCH_LIMITS.Q_LIMIT * 4) {
    // バッファとして 4 倍までは accept（trim 前判定）
    return { ok: false, status: 422, error: "q too long" };
  }
  const q = normalizeQ(qRaw);
  if (q.length > ADMIN_SEARCH_LIMITS.Q_LIMIT) {
    return { ok: false, status: 422, error: "q too long" };
  }

  const zoneRaw = query.zone ?? "all";
  if (!isOneOf(zoneRaw, ADMIN_ZONE_VALUES)) {
    return { ok: false, status: 422, error: "invalid zone" };
  }

  const sortRaw = query.sort ?? "recent";
  if (!isOneOf(sortRaw, ADMIN_SORT_VALUES)) {
    return { ok: false, status: 422, error: "invalid sort" };
  }

  const densityRaw = query.density ?? "comfy";
  if (!isOneOf(densityRaw, ADMIN_DENSITY_VALUES)) {
    return { ok: false, status: 422, error: "invalid density" };
  }

  const tags = rawQueries.tag.filter((t) => t && t.length > 0);
  if (tags.length > ADMIN_SEARCH_LIMITS.TAG_LIMIT) {
    return { ok: false, status: 422, error: "too many tags" };
  }

  let page = 1;
  if (query.page !== undefined && query.page !== "") {
    const n = Number(query.page);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      return { ok: false, status: 422, error: "invalid page" };
    }
    page = n;
  }

  return {
    ok: true,
    value: {
      filter,
      q,
      zone: zoneRaw,
      tags,
      sort: sortRaw,
      density: densityRaw,
      page,
    },
  };
};

interface BuiltQuery {
  whereSql: string;
  joinSql: string;
  havingSql: string;
  groupBySql: string;
  binds: unknown[];
}

const buildSearchSql = (s: ParsedSearch): BuiltQuery => {
  const where: string[] = [filterToSql(s.filter)];
  const joins: string[] = [];
  const binds: unknown[] = [];

  if (s.q) {
    // response_email + answers_json の主要キーを LIKE 検索。
    const like = `%${s.q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    where.push(
      "(LOWER(mi.response_email) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.fullName'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.nickname'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.occupation'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.location'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.businessOverview'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.skills'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.canProvide'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.selfIntroduction'), '')) LIKE LOWER(?) ESCAPE '\\')",
    );
    for (let i = 0; i < 9; i++) binds.push(like);
  }

  if (s.zone !== "all") {
    where.push("COALESCE(json_extract(mr.answers_json, '$.ubmZone'), '') = ?");
    binds.push(s.zone);
  }

  // tag AND: 各 tag を別 EXISTS で wrap して AND 条件にする
  for (const tag of s.tags) {
    where.push(
      "EXISTS (SELECT 1 FROM member_tags mt JOIN tag_definitions td ON td.tag_id = mt.tag_id WHERE mt.member_id = mi.member_id AND td.code = ?)",
    );
    binds.push(tag);
  }

  return {
    whereSql: `WHERE ${where.join(" AND ")}`,
    joinSql: joins.join(" "),
    havingSql: "",
    groupBySql: "",
    binds,
  };
};

const sortToSql = (sort: AdminSort): string => {
  if (sort === "name") {
    return "ORDER BY COALESCE(json_extract(mr.answers_json, '$.fullName'), '') ASC, mi.last_submitted_at DESC";
  }
  return "ORDER BY mi.last_submitted_at DESC";
};

// issue-983 / issue-1030: photo row 有 かつ presign 成功時のみ presigned URL を返す（fail-soft）。
// display(photoUrl) と thumb(photoThumbUrl) を独立に presign する（片方失敗でももう片方は返る）。
// secret 未設定 / photo 不在 / presign 失敗時は当該 URL を undefined（detail は 200 を維持）。
const resolvePhotoUrls = async (
  env: AdminRouteEnv,
  db: DbCtx,
  mid: MemberId,
): Promise<{ photoUrl?: string; photoThumbUrl?: string }> => {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return {};
  }
  const photo = await getMemberPhoto(db, mid);
  if (!photo) return {};
  const bucketName = env.MEMBER_PHOTOS
    ? env.ENVIRONMENT === "production"
      ? "ubm-hyogo-member-photos-prod"
      : "ubm-hyogo-member-photos-staging"
    : null;
  if (!bucketName) return {};
  const deps = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: bucketName,
  };
  const displayUrl = await presignMemberPhotoGetUrl(
    deps,
    photo.objectKey,
    MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  );
  // thumb は保存済（thumbObjectKey 非 null）のときのみ presign する（fail-soft で独立）。
  const thumbUrl = photo.thumbObjectKey
    ? await presignMemberPhotoGetUrl(
        deps,
        photo.thumbObjectKey,
        MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
      )
    : null;
  const result: { photoUrl?: string; photoThumbUrl?: string } = {};
  if (displayUrl) result.photoUrl = displayUrl;
  if (thumbUrl) result.photoThumbUrl = thumbUrl;
  return result;
};

export const createAdminMembersRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables & RepositoryProviderVariables & Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  // admin gate 後段で repository provider を bind（issue-371）
  app.use("*", attendanceProviderMiddleware);
  app.use("*", writeTagNoteProviderMiddleware);

  app.get("/members", async (c) => {
    try {
      const queries = c.req.queries();
      const single: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(queries)) {
        single[k] = v[0];
      }
      const tagArr = queries.tag ?? [];

      const parsed = parseSearchOrError(single, { tag: tagArr });
      if (!parsed.ok) {
        return c.json({ ok: false, error: parsed.error }, parsed.status);
      }
      const s = parsed.value;
      const built = buildSearchSql(s);

      if (!c.env?.DB) {
        logError({ code: ADMIN_MEMBERS_ERROR_CODE, phase: "binding-missing" });
        return c.json(
          { ok: false, error: "DB binding missing", code: ADMIN_MEMBERS_ERROR_CODE },
          503,
        );
      }
      const db = ctx({ DB: c.env.DB });

      // total count
      const countRow = await db.db
        .prepare(
          `SELECT COUNT(DISTINCT mi.member_id) AS n
         FROM member_identities mi
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
         LEFT JOIN member_status ms ON ms.member_id = mi.member_id
         ${built.joinSql}
         ${built.whereSql} AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`,
        )
        .bind(...built.binds)
        .first<{ n: number }>();
      const total = countRow?.n ?? 0;

      const offset = (s.page - 1) * ADMIN_SEARCH_LIMITS.PAGE_SIZE;
      const r = await db.db
        .prepare(
          `SELECT mi.member_id, mi.response_email, mi.last_submitted_at,
                mr.answers_json,
                (
                  SELECT json_group_array(json_object('code', td.code, 'label', td.label))
                  FROM member_tags mt
                  JOIN tag_definitions td ON td.tag_id = mt.tag_id
                  WHERE mt.member_id = mi.member_id
                ) AS tags_json,
                ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
         FROM member_identities mi
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
         LEFT JOIN member_status ms ON ms.member_id = mi.member_id
         ${built.joinSql}
         ${built.whereSql} AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
         ${sortToSql(s.sort)}
         LIMIT ? OFFSET ?`,
        )
        .bind(...built.binds, ADMIN_SEARCH_LIMITS.PAGE_SIZE, offset)
        .all<MemberListRow>();

      const members = (r.results ?? []).map((row) => {
        let fullName = "";
        let occupation: string | undefined;
        let ubmZone: string | null | undefined;
        let ubmMembershipType: string | null | undefined;
        if (row.answers_json) {
          try {
            const p = JSON.parse(row.answers_json) as Record<string, unknown>;
            const fn = p[STABLE_KEY.fullName];
            if (typeof fn === "string") fullName = fn;
            occupation = readString(p, STABLE_KEY.occupation);
            ubmZone = readNullableString(p, STABLE_KEY.ubmZone);
            ubmMembershipType = readNullableString(p, STABLE_KEY.ubmMembershipType);
          } catch {
            // ignore
          }
        }
        return {
          memberId: row.member_id,
          responseEmail: row.response_email,
          fullName,
          publicConsent: normalizeConsent(row.public_consent),
          rulesConsent: normalizeConsent(row.rules_consent),
          publishState: normalizePublishState(row.publish_state),
          isDeleted: row.is_deleted === 1,
          lastSubmittedAt: normalizeIso(row.last_submitted_at),
          occupation,
          ubmZone,
          ubmMembershipType,
          tags: parseTagsJson(row.tags_json),
          updatedAt: normalizeIso(row.last_submitted_at),
        };
      });

      const view = {
        total,
        members,
        page: s.page,
        pageSize: ADMIN_SEARCH_LIMITS.PAGE_SIZE,
      };
      const parsedView = AdminMemberListViewZ.safeParse(view);
      if (!parsedView.success) {
        logError({
          code: ADMIN_MEMBERS_ERROR_CODE,
          phase: "zod",
          issues: parsedView.error.flatten(),
        });
        return c.json(
          { ok: false, error: "internal", code: ADMIN_MEMBERS_ERROR_CODE },
          500,
        );
      }
      return c.json(parsedView.data, 200);
    } catch (err) {
      logError({
        code: ADMIN_MEMBERS_ERROR_CODE,
        phase: "exception",
        name: (err as Error)?.name,
        message: (err as Error)?.message,
      });
      return c.json(
        { ok: false, error: "internal", code: ADMIN_MEMBERS_ERROR_CODE },
        500,
      );
    }
  });

  app.get("/members/:memberId", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

    const auditRows = await requireProvider(c.var.auditLogProvider, "auditLogProvider")
      .listByTarget("member", memberId, 50);
    const adminAudit = auditRows.map((a) => ({
      actor: asAdminId(a.actorEmail ?? a.actorId ?? "system"),
      action: a.action as string,
      occurredAt: normalizeIso(a.createdAt),
      note: null as string | null,
    }));

    const view = await buildAdminMemberDetailView(
      { ...db, var: { attendanceProvider: c.var.attendanceProvider } },
      mid,
      adminAudit,
      // issue-372: admin detail も先頭ページ + cursor を返す
      { attendancePage: { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT } },
    );
    if (!view) return c.json({ ok: false, error: "not found" }, 404);

    const parsed = AdminMemberDetailViewZ.safeParse(view);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }

    // issue-983 / issue-1030: photo row 有 かつ presign 成功時のみ photoUrl / photoThumbUrl を
    // 後段マージする（fail-soft・各独立）。builder を R2 非依存に保つため解決は route 層で行う。
    const photoUrls = await resolvePhotoUrls(c.env, db, mid);
    return c.json({ ...parsed.data, ...photoUrls }, 200);
  });

  // issue-983: POST /admin/members/:memberId/photo — multipart upload → R2 put + D1 upsert + audit
  app.post("/members/:memberId/photo", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    if (!c.env?.DB) return c.json({ ok: false, error: "DB binding missing" }, 503);

    // member 存在確認
    if (!(await memberExists(c.env.DB, memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }

    // multipart body 取得
    const formData = await c.req.formData().catch(() => null);
    // issue-1030: display(必須) / thumb(任意) / contentHash(任意)。
    // 後方互換: display 不在で旧 `file` が在れば display 扱い・thumb なし。
    const displayField = formData?.get("display");
    const legacyFile = formData?.get("file");
    const display =
      displayField instanceof File
        ? displayField
        : legacyFile instanceof File
          ? legacyFile
          : null;
    if (!display) {
      return c.json({ ok: false, error: "file/display field required" }, 400);
    }
    const thumbField = formData?.get("thumb");
    const thumb = thumbField instanceof File ? thumbField : null;
    const contentHashField = formData?.get("contentHash");
    const contentHash =
      typeof contentHashField === "string" && contentHashField.length > 0
        ? contentHashField
        : null;

    // display MIME 検証（AC-6）
    if (!(MEMBER_PHOTO_ALLOWED_MIME as readonly string[]).includes(display.type)) {
      return c.json({ ok: false, error: "unsupported media type" }, 415);
    }

    // display サイズ検証（AC-6・検証失敗時は副作用ゼロ）
    const displayBuf = await display.arrayBuffer();
    if (displayBuf.byteLength === 0) {
      return c.json({ ok: false, error: "empty file" }, 400);
    }
    if (displayBuf.byteLength > MEMBER_PHOTO_MAX_BYTES) {
      return c.json({ ok: false, error: "file too large" }, 413);
    }

    // thumb 検証（在るときのみ・MIME 415 / サイズ 413・副作用ゼロ）
    let thumbBuf: ArrayBuffer | null = null;
    if (thumb) {
      if (!(MEMBER_PHOTO_ALLOWED_MIME as readonly string[]).includes(thumb.type)) {
        return c.json({ ok: false, error: "unsupported thumb media type" }, 415);
      }
      thumbBuf = await thumb.arrayBuffer();
      if (thumbBuf.byteLength > MEMBER_PHOTO_THUMB_MAX_BYTES) {
        return c.json({ ok: false, error: "thumb too large" }, 413);
      }
    }

    // R2 binding が無い場合は 503（fail-soft では握り潰さず明示）
    if (!c.env.MEMBER_PHOTOS) {
      return c.json({ ok: false, error: "R2 binding missing" }, 503);
    }

    const objectKey = MEMBER_PHOTO_OBJECT_KEY(memberId);
    await c.env.MEMBER_PHOTOS.put(objectKey, displayBuf, {
      httpMetadata: { contentType: display.type },
    });

    const hasThumb = thumb !== null && thumbBuf !== null;
    const thumbObjectKey = hasThumb ? MEMBER_PHOTO_THUMB_OBJECT_KEY(memberId) : null;
    if (hasThumb && thumbObjectKey && thumbBuf) {
      await c.env.MEMBER_PHOTOS.put(thumbObjectKey, thumbBuf, {
        httpMetadata: { contentType: thumb.type },
      });
    }

    const processingStatus: MemberPhotoProcessingStatus = hasThumb
      ? "client_generated"
      : "original_fallback";

    const db = ctx({ DB: c.env.DB });
    const actorEmail = c.var.authUser?.email ?? "unknown";
    await upsertMemberPhoto(db, {
      memberId,
      objectKey,
      contentType: display.type,
      byteSize: displayBuf.byteLength,
      thumbObjectKey,
      thumbByteSize: hasThumb && thumbBuf ? thumbBuf.byteLength : null,
      contentHash,
      processingStatus,
      uploadedBy: actorEmail,
      // issue-1031: admin 代行 upload は source='admin' を明示（source 列追加後も既存挙動維持・backfill）。
      source: "admin",
    });

    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: null,
      actorEmail: adminEmail(actorEmail),
      action: auditAction("admin.member.photo_uploaded"),
      targetType: "member",
      targetId: memberId,
      // signed URL / raw bytes は残さず、variant 有無のみ記録する。
      after: {
        objectKey,
        contentType: display.type,
        byteSize: displayBuf.byteLength,
        hasThumb,
        processingStatus,
      },
    });

    return c.json({ ok: true }, 200);
  });

  // issue-983: DELETE /admin/members/:memberId/photo — R2 delete + D1 delete + audit
  app.delete("/members/:memberId/photo", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    if (!c.env?.DB) return c.json({ ok: false, error: "DB binding missing" }, 503);

    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    const photo = await getMemberPhoto(db, mid);
    if (!photo) return c.json({ ok: false, error: "photo not found" }, 404);

    if (c.env.MEMBER_PHOTOS) {
      await c.env.MEMBER_PHOTOS.delete(photo.objectKey);
      // issue-1030: thumb variant も削除（best-effort・例外で 500 にしない）。
      if (photo.thumbObjectKey) {
        await c.env.MEMBER_PHOTOS.delete(photo.thumbObjectKey).catch(() => {});
      }
    }
    await deleteMemberPhoto(db, mid);

    const actorEmail = c.var.authUser?.email ?? "unknown";
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: null,
      actorEmail: adminEmail(actorEmail),
      action: auditAction("admin.member.photo_deleted"),
      targetType: "member",
      targetId: memberId,
      before: { objectKey: photo.objectKey },
    });

    return c.json({ ok: true }, 200);
  });

  // GET /admin/members/:memberId/attendance — issue-372: ページング継続取得
  app.get("/members/:memberId/attendance", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);

    const limitRaw = c.req.query("limit");
    let limit: number | undefined;
    if (limitRaw !== undefined && limitRaw !== "") {
      const n = Number(limitRaw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        return c.json({ ok: false, error: "invalid limit" }, 400);
      }
      limit = n > ATTENDANCE_PAGE_MAX_LIMIT ? ATTENDANCE_PAGE_MAX_LIMIT : n;
    }

    const cursorRaw = c.req.query("cursor");
    let cursor: ReturnType<typeof decodeAttendanceCursor> = null;
    if (cursorRaw !== undefined && cursorRaw !== "") {
      cursor = decodeAttendanceCursor(cursorRaw);
      if (!cursor) return c.json({ ok: false, error: "invalid cursor" }, 400);
    }

    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    const provider = createAttendanceProvider(db);
    const opts: { limit?: number; cursor?: NonNullable<typeof cursor> } = {};
    if (limit !== undefined) opts.limit = limit;
    if (cursor) opts.cursor = cursor;
    const page = await provider.findByMemberId(mid, opts);
    return c.json(
      {
        records: page.records.map((r) => ({
          sessionId: r.sessionId,
          title: r.title,
          heldOn: r.heldOn,
        })),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      },
      200,
    );
  });

  // ---------------------------------------------------------------------------
  // issue-982: member tag の admin manual 付与 / 解除 / master 読取
  //   不変条件 #13 再定義: admin manual 経路は audit 必須で member_tags を直接 write する。
  // issue-1036: bulk（複数 member × 複数 tag）の付与 / 解除（第3経路）+ tag master read。
  // ---------------------------------------------------------------------------

  // GET /admin/tags → { available }（tag master read。bulk UI の tag picker 用）
  app.get("/tags", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const available = await getTagDefinitionMaster(db);
    return c.json({ available }, 200);
  });

  // POST /admin/members/tags/bulk  body { memberIds, tagIds, op }
  //   → 200 + { batchId, results }（部分失敗も 200・AC-1/AC-2）
  //   ※ `:memberId` 系より前に登録すること（Hono 登録順マッチ・路 "/members/tags/bulk" の誤マッチ回避）
  app.post("/members/tags/bulk", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = BulkTagBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: "invalid_body" }, 400);
    }

    const db = ctx({ DB: c.env.DB });
    const authUser = c.get("authUser");
    const result = await bulkApplyMemberTagsByAdmin(
      db,
      {
        memberIds: parsed.data.memberIds.map(asMemberId),
        tagIds: parsed.data.tagIds,
        op: parsed.data.op,
      },
      { id: asAdminId(authUser.memberId), email: adminEmail(authUser.email) },
    );

    // 実 mutation した member×tag 単位で audit 1 件（AC-3・既存単一 endpoint と action 名 parity）
    const audit = requireProvider(c.var.auditLogProvider, "auditLogProvider");
    for (const item of result.results) {
      if (item.status === "assigned") {
        await audit.append({
          actorId: asAdminId(authUser.memberId),
          actorEmail: adminEmail(authUser.email),
          action: auditAction("admin.member.tag_assigned"),
          targetType: "member",
          targetId: item.memberId,
          before: null,
          after: { tagId: item.tagId, source: "manual", batchId: result.batchId },
        });
      } else if (item.status === "unassigned") {
        await audit.append({
          actorId: asAdminId(authUser.memberId),
          actorEmail: adminEmail(authUser.email),
          action: auditAction("admin.member.tag_unassigned"),
          targetType: "member",
          targetId: item.memberId,
          before: { tagId: item.tagId, batchId: result.batchId },
          after: null,
        });
      }
    }

    return c.json(result, 200);
  });

  // GET /admin/members/:memberId/tags → { assigned, available }
  app.get("/members/:memberId/tags", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

    const deleted = await getMemberDeletedFlag(db, mid);
    if (deleted === null) {
      return c.json({ ok: false, error: "member_not_found" }, 404);
    }

    const [assigned, available] = await Promise.all([
      listAssignedTagsForMember(db, mid),
      getTagDefinitionMaster(db),
    ]);
    return c.json({ assigned, available }, 200);
  });

  // POST /admin/members/:memberId/tags  body { tagId } → tag 付与（冪等）
  app.post("/members/:memberId/tags", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = AssignTagBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const { tagId } = parsed.data;

    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

    const deleted = await getMemberDeletedFlag(db, mid);
    if (deleted === null) {
      return c.json({ ok: false, error: "member_not_found" }, 404);
    }
    if (deleted) {
      return c.json({ ok: false, error: "member_is_deleted" }, 409);
    }

    const tagDef = await findTagDefinitionById(db, tagId);
    if (!tagDef) {
      return c.json({ ok: false, error: "tag_not_found" }, 404);
    }

    const authUser = c.get("authUser");
    const applied = await assignTagToMemberByAdmin(db, mid, tagId, authUser.email);
    if (applied) {
      const batchId = crypto.randomUUID();
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_assigned"),
        targetType: "member",
        targetId: memberId,
        before: null,
        after: { tagId, source: "manual", batchId },
      });
    }

    const [assigned, available] = await Promise.all([
      listAssignedTagsForMember(db, mid),
      getTagDefinitionMaster(db),
    ]);
    return c.json({ assigned, available }, 200);
  });

  // DELETE /admin/members/:memberId/tags/:tagId → tag 解除（未存在でも 204 で冪等）
  app.delete("/members/:memberId/tags/:tagId", async (c) => {
    const memberId = c.req.param("memberId");
    const tagId = c.req.param("tagId");
    if (!memberId || !tagId) {
      return c.json({ ok: false, error: "missing path params" }, 400);
    }

    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

    const deleted = await getMemberDeletedFlag(db, mid);
    if (deleted === null) {
      return c.json({ ok: false, error: "member_not_found" }, 404);
    }
    if (deleted) {
      return c.json({ ok: false, error: "member_is_deleted" }, 409);
    }

    const removed = await unassignTagFromMemberByAdmin(db, mid, tagId);
    if (removed) {
      const authUser = c.get("authUser");
      const batchId = crypto.randomUUID();
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_unassigned"),
        targetType: "member",
        targetId: memberId,
        before: { tagId, batchId },
        after: null,
      });
    }

    return c.body(null, 204);
  });

  return app;
};

export const adminMembersRoute = createAdminMembersRoute();
