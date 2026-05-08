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
import { adminRequestResolveBodySchema, STABLE_KEY } from "@ubm-hyogo/shared";
import {
  requireAdmin,
  type RequireAuthVariables,
} from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import {
  type AdminMemberNoteRow,
  type ListPendingRequestsCursor,
  type NotificationOutboxRepository,
  requireProvider,
} from "../../repository/_shared/provider-context";
import { getStatus } from "../../repository/status";
import {
  asMemberId,
} from "../../repository/_shared/brand";
import {
  writeTagNoteProviderMiddleware,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { RETENTION_DAYS } from "../../services/retention-policy";
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
  STABLE_KEY.fullName,
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

export interface AdminRequestsRouteDeps {
  outboxFactory?: (env: AdminRouteEnv) => NotificationOutboxRepository;
  logger?: { warn?: (msg: string, meta?: Record<string, unknown>) => void };
}

const addDaysIso = (baseIso: string, days: number): string =>
  new Date(new Date(baseIso).getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const createAdminRequestsRoute = (
  deps: AdminRequestsRouteDeps = {},
) => {
  const logger = deps.logger ?? console;
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables & Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);

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
    const { rows, nextCursor } = await requireProvider(
      c.var.adminNotesProvider,
      "adminNotesProvider",
    ).listPendingRequests({
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
    const adminNotesProvider = requireProvider(
      c.var.adminNotesProvider,
      "adminNotesProvider",
    );
    const note = await adminNotesProvider.findById(noteId);
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
    const retentionPurgeScheduledAt =
      noteTypeNarrowed === "delete_request" && resolution === "approve"
        ? addDaysIso(nowIso, RETENTION_DAYS)
        : null;

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
      retentionPurgeScheduledAt,
    });

    let desiredPublishState: PublishState | null = null;

    if (resolution === "approve") {
      if (noteTypeNarrowed === "visibility_request") {
        const parsedBody = parseNoteBody(note.body);
        desiredPublishState = inferDesiredPublishState(noteTypeNarrowed, parsedBody.payload);
        if (!desiredPublishState) {
          return c.json(
            { ok: false, error: "invalid desiredState in request payload" },
            422,
          );
        }
      }
    }

    const resolveResult = await adminNotesProvider.resolveRequestAtomic({
      noteId,
      noteType: noteTypeNarrowed,
      resolution,
      resolutionNote: resolutionNote ?? null,
      noteSuffix,
      adminId,
      adminEmailRaw: adminIdRaw,
      nowMs,
      nowIso,
      auditId,
      auditAfter,
      desiredPublishState,
    });
    if (!resolveResult.changed) {
      // 競合: 直前に他 admin が resolve 済 → 409
      const after = await adminNotesProvider.findById(noteId);
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

    // Issue #401: best-effort 通知 enqueue。失敗しても resolve は 200 を維持する。
    try {
      const outbox = deps.outboxFactory
        ? deps.outboxFactory(c.env)
        : requireProvider(
            c.var.notificationOutboxProvider,
            "notificationOutboxProvider",
          );
      const recipient = await outbox.findRecipientEmail(memberId);
      if (!recipient) {
        logger.warn?.("notification_enqueue_skipped", {
          noteId,
          reason: "missing_email",
        });
      } else {
        const enqueueResult = await outbox.enqueue({
          noteId,
          memberId,
          recipientEmail: recipient.responseEmail,
          outcome: resolution === "approve" ? "approved" : "rejected",
          requestType: noteTypeNarrowed,
          // `resolutionNote` は管理者の内部自由記述として既存 note 境界に閉じる。
          // member 向けメールには明示的に作られた通知用 summary だけを載せる。
          reasonSummaryRaw: null,
          nowIso,
        });
        if (!enqueueResult.ok && enqueueResult.reason !== "duplicate") {
          logger.warn?.("notification_enqueue_failed", {
            noteId,
            reason: enqueueResult.reason,
          });
        }
      }
    } catch (e) {
      logger.warn?.("notification_enqueue_failed", {
        noteId,
        error: e instanceof Error ? e.message : String(e),
      });
    }

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
      retentionPurgeScheduledAt,
    });
  });

  return app;
};

export const adminRequestsRoute = createAdminRequestsRoute();
