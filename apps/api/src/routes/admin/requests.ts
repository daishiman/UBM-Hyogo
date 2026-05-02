// 04b-followup-004: admin queue resolve workflow
//
// 不変条件 #4: admin-managed data 分離。member_responses には触れない。
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる。
// 不変条件 #11: admin gate 二段防御を維持（apps/web layout / proxy + 本 route の requireAdmin）。
//
// `GET  /admin/requests?status=pending&type=visibility_request|delete_request`
// `POST /admin/requests/:noteId/resolve` body: { resolution, resolutionNote? }
import { Hono } from "hono";
import { z } from "zod";
import { adminRequestResolveBodySchema } from "@ubm-hyogo/shared";
import {
  requireAdmin,
  type RequireAuthVariables,
} from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import {
  findById as findNoteById,
  listPendingRequests,
  type AdminMemberNoteRow,
  type ListPendingRequestsCursor,
} from "../../repository/adminNotes";
import { getStatus } from "../../repository/status";
import {
  asMemberId,
  adminEmail,
  auditAction,
} from "../../repository/_shared/brand";
import type { AdminRouteEnv } from "./_shared";

const NOTE_TYPES = ["visibility_request", "delete_request"] as const;
type RequestNoteType = (typeof NOTE_TYPES)[number];

const StatusZ = z.enum(["pending", "resolved", "rejected"]).default("pending");
const TypeZ = z.enum(NOTE_TYPES);

const ListQueryZ = z.object({
  status: StatusZ.optional(),
  type: TypeZ,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).optional(),
});

// cursor は base64url(JSON {createdAt,noteId})
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const b64uEncode = (s: string): string => {
  let bin = "";
  for (const b of textEncoder.encode(s)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const b64uDecode = (s: string): string => {
  const padded = s
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return textDecoder.decode(bytes);
};
const encodeCursor = (c: ListPendingRequestsCursor): string =>
  b64uEncode(JSON.stringify(c));
const decodeCursor = (raw: string): ListPendingRequestsCursor | null => {
  try {
    const parsed = JSON.parse(b64uDecode(raw)) as Partial<ListPendingRequestsCursor>;
    if (typeof parsed.createdAt !== "string" || typeof parsed.noteId !== "string") {
      return null;
    }
    return { createdAt: parsed.createdAt, noteId: parsed.noteId };
  } catch {
    return null;
  }
};

// `requestedPayload` projection: PII を含めず、依頼判断に必要な最小限のみを通す。
// visibility_request: { desiredState }, delete_request: payload は通常空（reason のみ別出し）
const PII_KEYS = new Set([
  "email",
  "mail",
  "phone",
  "tel",
  "mobile",
  "address",
  "addr",
  "name",
  "fullName",
  "fullname",
  "firstName",
  "firstname",
  "lastName",
  "lastname",
  "displayName",
  "displayname",
  "kana",
  "postal",
  "postalCode",
  "zip",
]);
const sanitizePayload = (raw: unknown): unknown => {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw.map(sanitizePayload);
  if (typeof raw === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (PII_KEYS.has(k)) continue;
      out[k] = sanitizePayload(v);
    }
    return out;
  }
  return raw;
};

interface ParsedNoteBody {
  reason: string | null;
  payload: unknown;
}
const parseNoteBody = (body: string): ParsedNoteBody => {
  try {
    const v = JSON.parse(body) as Partial<ParsedNoteBody> | null;
    if (v && typeof v === "object") {
      return {
        reason: typeof v.reason === "string" ? v.reason : null,
        payload: v.payload === undefined ? null : v.payload,
      };
    }
  } catch {
    /* fallthrough */
  }
  return { reason: null, payload: null };
};

const projectListItem = (
  row: AdminMemberNoteRow,
  member: { publishState: string; isDeleted: boolean; publicHandle: string | null } | null,
) => {
  const parsed = parseNoteBody(row.body);
  return {
    noteId: row.noteId,
    memberId: row.memberId as string,
    noteType: row.noteType as RequestNoteType,
    requestStatus: row.requestStatus,
    requestedAt: row.createdAt,
    requestedReason: parsed.reason,
    requestedPayload: sanitizePayload(parsed.payload),
    memberSummary: {
      memberId: row.memberId as string,
      publicHandle: member?.publicHandle ?? null,
      publishState: member?.publishState ?? "unknown",
      isDeleted: member?.isDeleted ?? false,
    },
  };
};

const PUBLISH_STATES = ["public", "hidden", "member_only"] as const;
type PublishState = (typeof PUBLISH_STATES)[number];

const inferDesiredPublishState = (
  noteType: RequestNoteType,
  payload: unknown,
): PublishState | null => {
  if (noteType !== "visibility_request") return null;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const v = (payload as Record<string, unknown>)["desiredState"];
    if (typeof v === "string" && (PUBLISH_STATES as readonly string[]).includes(v)) {
      return v as PublishState;
    }
  }
  return null;
};

export const createAdminRequestsRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables;
  }>();
  app.use("*", requireAdmin);

  app.get("/requests", async (c) => {
    const url = new URL(c.req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = ListQueryZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const { type, limit } = parsed.data;
    const status = parsed.data.status ?? "pending";
    let cursor: ListPendingRequestsCursor | null = null;
    if (parsed.data.cursor) {
      cursor = decodeCursor(parsed.data.cursor);
      if (!cursor) {
        return c.json({ ok: false, error: "invalid cursor" }, 400);
      }
    }
    const db = ctx({ DB: c.env.DB });
    const { rows, nextCursor } = await listPendingRequests(db, {
      status,
      type,
      limit,
      cursor,
    });
    // 一覧表示用 member summary（最小限）。N+1 を避けるため bulk SELECT する。
    const memberIds = Array.from(new Set(rows.map((r) => r.memberId as string)));
    const memberMap = new Map<
      string,
      { publishState: string; isDeleted: boolean; publicHandle: string | null }
    >();
    if (memberIds.length > 0) {
      const ph = memberIds.map((_, i) => `?${i + 1}`).join(",");
      const result = await c.env.DB.prepare(
        `SELECT member_id AS memberId, publish_state AS publishState, is_deleted AS isDeleted
           FROM member_status
          WHERE member_id IN (${ph})`,
      )
        .bind(...memberIds)
        .all<{
          memberId: string;
          publishState: string;
          isDeleted: number;
        }>();
      for (const r of result.results ?? []) {
        memberMap.set(r.memberId, {
          publishState: r.publishState,
          isDeleted: r.isDeleted === 1,
          publicHandle: null,
        });
      }
    }
    return c.json({
      ok: true,
      items: rows.map((r) => projectListItem(r, memberMap.get(r.memberId as string) ?? null)),
      nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      appliedFilters: { status, type },
    });
  });

  app.post("/requests/:noteId/resolve", async (c) => {
    const noteId = c.req.param("noteId");
    if (!noteId) return c.json({ ok: false, error: "missing noteId" }, 400);
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = adminRequestResolveBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const { resolution, resolutionNote } = parsed.data;

    const db = ctx({ DB: c.env.DB });
    const note = await findNoteById(db, noteId);
    if (!note) return c.json({ ok: false, error: "note not found" }, 404);
    if (note.noteType !== "visibility_request" && note.noteType !== "delete_request") {
      return c.json({ ok: false, error: "unsupported note type" }, 400);
    }
    if (note.requestStatus !== "pending") {
      return c.json(
        { ok: false, error: "already_resolved", currentStatus: note.requestStatus },
        409,
      );
    }

    // admin id (audit metadata)。authClaims は requireAdmin 経由で必ず付く。
    const claims = c.get("authClaims");
    const adminIdRaw =
      (claims?.email as string | undefined) ??
      (claims?.memberId as string | undefined) ??
      "unknown";
    const adminId = adminIdRaw;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const noteTypeNarrowed = note.noteType as RequestNoteType;
    const memberId = note.memberId as string;

    if (resolution === "approve") {
      const currentStatus = await getStatus(db, asMemberId(memberId));
      if (!currentStatus) {
        return c.json(
          { ok: false, error: "member_status_not_found" },
          404,
        );
      }
    }

    // body resolution envelope: 確定操作のたびに append（PII を含めない運用）
    const tag = resolution === "approve" ? "[resolved]" : "[rejected]";
    const noteSuffix = resolutionNote
      ? `\n\n${tag} ${resolutionNote}`
      : `\n\n${tag}`;
    const auditId = crypto.randomUUID();
    const auditAfter = JSON.stringify({
      noteId,
      memberId,
      noteType: noteTypeNarrowed,
      resolution,
    });

    const stmts = [];

    if (resolution === "approve") {
      if (noteTypeNarrowed === "visibility_request") {
        const parsedBody = parseNoteBody(note.body);
        const desired = inferDesiredPublishState(noteTypeNarrowed, parsedBody.payload);
        if (!desired) {
          return c.json(
            { ok: false, error: "invalid desiredState in request payload" },
            422,
          );
        }
        stmts.push(
          c.env.DB.prepare(
            `UPDATE member_status
               SET publish_state = ?1,
                   updated_by = ?2,
                   updated_at = ?3
             WHERE member_id = (
               SELECT member_id FROM admin_member_notes
                WHERE note_id = ?4 AND request_status = 'pending'
             )`,
          ).bind(desired, adminId, nowIso, noteId),
        );
      } else {
        // delete_request: 論理削除
        stmts.push(
          c.env.DB.prepare(
            `UPDATE member_status
               SET is_deleted = 1,
                   updated_by = ?1,
                   updated_at = ?2
             WHERE member_id = (
               SELECT member_id FROM admin_member_notes
                WHERE note_id = ?3 AND request_status = 'pending'
             )`,
          ).bind(adminId, nowIso, noteId),
        );
        stmts.push(
          c.env.DB.prepare(
            `INSERT INTO deleted_members (member_id, deleted_by, deleted_at, reason)
             SELECT member_id, ?1, ?2, ?3 FROM admin_member_notes
              WHERE note_id = ?4 AND request_status = 'pending'
             ON CONFLICT(member_id) DO UPDATE SET
               deleted_by = excluded.deleted_by,
               deleted_at = excluded.deleted_at,
               reason = excluded.reason`,
          ).bind(adminId, nowIso, resolutionNote ?? "delete_request approved", noteId),
        );
      }
    }

    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO audit_log
          (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
         SELECT ?1, NULL, ?2, ?3, 'member', member_id, NULL, ?4, ?5
           FROM admin_member_notes
          WHERE note_id = ?6
            AND request_status = 'pending'`,
      ).bind(
        auditId,
        adminEmail(adminIdRaw),
        auditAction(`admin.request.${resolution}`),
        auditAfter,
        nowIso,
        noteId,
      ),
    );

    // note 楽観ロック更新（最後）。changes==0 → 409
    stmts.push(
      c.env.DB.prepare(
        `UPDATE admin_member_notes
            SET request_status = ?1,
                resolved_at = ?2,
                resolved_by_admin_id = ?3,
                body = body || ?4,
                updated_at = ?5
          WHERE note_id = ?6
            AND request_status = 'pending'`,
      ).bind(
        resolution === "approve" ? "resolved" : "rejected",
        nowMs,
        adminId,
        noteSuffix,
        nowIso,
        noteId,
      ),
    );

    const results = await c.env.DB.batch(stmts);
    const noteResult = results[results.length - 1];
    const auditResult = results[results.length - 2];
    if (
      !noteResult ||
      noteResult.meta.changes === 0 ||
      !auditResult ||
      auditResult.meta.changes === 0
    ) {
      // 競合: 直前に他 admin が resolve 済 → 409
      const after = await findNoteById(db, noteId);
      return c.json(
        {
          ok: false,
          error: "already_resolved",
          currentStatus: after?.requestStatus ?? null,
        },
        409,
      );
    }

    const after = await getStatus(db, asMemberId(memberId));
    return c.json({
      ok: true,
      noteId,
      requestStatus: resolution === "approve" ? "resolved" : "rejected",
      resolvedAt: nowIso,
      resolvedByAdminId: adminId,
      memberAfter: {
        memberId,
        publishState: after?.publish_state ?? "unknown",
        isDeleted: after?.is_deleted === 1,
      },
    });
  });

  return app;
};

export const adminRequestsRoute = createAdminRequestsRoute();
