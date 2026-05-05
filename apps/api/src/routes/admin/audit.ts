import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { listFiltered, type AuditLogListRow } from "../../repository/auditLog";
import type { AdminRouteEnv } from "./_shared";

const QueryZ = z.object({
  action: z.string().min(1).optional(),
  actorEmail: z.string().email().optional(),
  targetType: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

type Cursor = { createdAt: string; auditId: string };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const base64UrlEncode = (value: string): string => {
  let binary = "";
  for (const byte of textEncoder.encode(value)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlDecode = (value: string): string => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return textDecoder.decode(bytes);
};

export const encodeAuditCursor = (cursor: Cursor): string =>
  base64UrlEncode(JSON.stringify(cursor));

const decodeAuditCursor = (value: string): Cursor | null => {
  try {
    const parsed = JSON.parse(base64UrlDecode(value)) as Partial<Cursor>;
    if (typeof parsed.createdAt !== "string" || typeof parsed.auditId !== "string") {
      return null;
    }
    return { createdAt: parsed.createdAt, auditId: parsed.auditId };
  } catch {
    return null;
  }
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const jstInputToUtcIso = (value: string, endOfDate: boolean): string | null => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  const parts = dateOnly ?? dateTime;
  if (!parts) return null;
  const [, y, mo, d, h = "00", mi = "00", s = "00"] = parts;
  const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  const adjusted = utcMs - JST_OFFSET_MS + (dateOnly && endOfDate ? 24 * 60 * 60 * 1000 : 0);
  const iso = new Date(adjusted).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
};

const PII_KEY =
  /(^|_|\b)(email|mail|phone|tel|mobile|address|addr|name|fullname|firstname|lastname|displayname|kana|postal|zip)(_|$|\b)/i;
const normalizePiiKey = (key: string): string => key.toLowerCase().replace(/[-_\s]/g, "");
const isPiiKey = (key: string): boolean => {
  const normalized = normalizePiiKey(key);
  return (
    PII_KEY.test(key) ||
    ["email", "mail", "phone", "tel", "mobile", "address", "addr", "name", "kana", "postal", "zip"].some((token) =>
      normalized.includes(token),
    )
  );
};
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_VALUE = /^\+?[\d\s().-]{8,}$/;

const maskJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskJsonValue);
  if (typeof value === "string" && (EMAIL_VALUE.test(value) || PHONE_VALUE.test(value))) {
    return "[masked]";
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        isPiiKey(key) ? "[masked]" : maskJsonValue(child),
      ]),
    );
  }
  return value;
};

const parseAndMask = (json: string | null): { value: unknown | null; parseError: boolean } => {
  if (json === null || json === "") return { value: null, parseError: false };
  try {
    return { value: maskJsonValue(JSON.parse(json)), parseError: false };
  } catch {
    return { value: null, parseError: true };
  }
};

const toResponseItem = (row: AuditLogListRow) => {
  const before = parseAndMask(row.beforeJson);
  const after = parseAndMask(row.afterJson);
  return {
    auditId: row.auditId,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    maskedBefore: before.value,
    maskedAfter: after.value,
    parseError: before.parseError || after.parseError,
    createdAt: row.createdAt,
  };
};

export const createAdminAuditRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/audit", async (c) => {
    const parsed = QueryZ.safeParse({
      action: c.req.query("action") || undefined,
      actorEmail: c.req.query("actorEmail") || undefined,
      targetType: c.req.query("targetType") || undefined,
      targetId: c.req.query("targetId") || undefined,
      from: c.req.query("from") || undefined,
      to: c.req.query("to") || undefined,
      cursor: c.req.query("cursor") || undefined,
      limit: c.req.query("limit") ?? undefined,
    });
    if (!parsed.success) {
      return c.json({ ok: false, error: "invalid query" }, 400);
    }

    const fromUtc = parsed.data.from ? jstInputToUtcIso(parsed.data.from, false) : undefined;
    const toUtcExclusive = parsed.data.to ? jstInputToUtcIso(parsed.data.to, true) : undefined;
    if ((parsed.data.from && !fromUtc) || (parsed.data.to && !toUtcExclusive)) {
      return c.json({ ok: false, error: "invalid date range" }, 400);
    }
    if (fromUtc && toUtcExclusive && fromUtc >= toUtcExclusive) {
      return c.json({ ok: false, error: "invalid date range" }, 400);
    }

    const cursor = parsed.data.cursor ? decodeAuditCursor(parsed.data.cursor) : undefined;
    if (parsed.data.cursor && !cursor) {
      return c.json({ ok: false, error: "invalid cursor" }, 400);
    }

    const limit = parsed.data.limit;
    const rows = await listFiltered(ctx({ DB: c.env.DB }), {
      ...(parsed.data.action ? { action: parsed.data.action } : {}),
      ...(parsed.data.actorEmail ? { actorEmail: parsed.data.actorEmail.toLowerCase() } : {}),
      ...(parsed.data.targetType ? { targetType: parsed.data.targetType } : {}),
      ...(parsed.data.targetId ? { targetId: parsed.data.targetId } : {}),
      ...(fromUtc ? { fromUtc } : {}),
      ...(toUtcExclusive ? { toUtcExclusive } : {}),
      ...(cursor ? { cursor } : {}),
      limit: limit + 1,
    });
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    return c.json(
      {
        ok: true,
        items: pageRows.map(toResponseItem),
        nextCursor:
          rows.length > limit && last
            ? encodeAuditCursor({ createdAt: last.createdAt, auditId: last.auditId })
            : null,
        appliedFilters: {
          action: parsed.data.action ?? null,
          actorEmail: parsed.data.actorEmail?.toLowerCase() ?? null,
          targetType: parsed.data.targetType ?? null,
          targetId: parsed.data.targetId ?? null,
          from: parsed.data.from ?? null,
          to: parsed.data.to ?? null,
          limit,
        },
      },
      200,
    );
  });

  return app;
};

export const adminAuditRoute = createAdminAuditRoute();
