// 06c: client-side mutation helper。
// 同一 origin の /api/admin/* proxy 経由で backend Worker を叩く。
// 不変条件 #5: web → D1 直接アクセス禁止。本ファイル経由でのみ admin API を呼ぶ。
// 不変条件 #11: profile 本文編集 mutation は本ライブラリに**意図的に存在させない**。
// 不変条件 #13: tag 直接更新 mutation も存在させない（resolveTagQueue のみ）。
import type {
  AdminRequestResolveBody,
  TagQueueResolveBody,
} from "@ubm-hyogo/shared";
import { z } from "zod";

export interface AdminMutationOk<T = unknown> {
  ok: true;
  status: number;
  data: T;
}
export interface AdminMutationErr {
  ok: false;
  status: number;
  error: string;
  data?: unknown;
}
export type AdminMutationResult<T = unknown> = AdminMutationOk<T> | AdminMutationErr;

async function call<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<AdminMutationResult<T>> {
  const init: RequestInit = {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : {},
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, init);
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network error" };
  }
  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const err =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    return { ok: false, status: res.status, error: err, data };
  }
  return { ok: true, status: res.status, data: data as T };
}

export const patchMemberStatus = (
  memberId: string,
  body: { publishState?: "public" | "member_only" | "hidden"; hiddenReason?: string | null },
) => call(`/members/${encodeURIComponent(memberId)}/status`, "PATCH", body);

export const postMemberNote = (memberId: string, body: string) =>
  call(`/members/${encodeURIComponent(memberId)}/notes`, "POST", { body });

export const patchMemberNote = (memberId: string, noteId: string, body: string) =>
  call(`/members/${encodeURIComponent(memberId)}/notes/${encodeURIComponent(noteId)}`, "PATCH", { body });

export const deleteMember = (memberId: string, reason: string) =>
  call(`/members/${encodeURIComponent(memberId)}/delete`, "POST", { reason });

export const restoreMember = (memberId: string) =>
  call(`/members/${encodeURIComponent(memberId)}/restore`, "POST", {});

export const resolveTagQueue = (queueId: string, body: TagQueueResolveBody) =>
  call(`/tags/queue/${encodeURIComponent(queueId)}/resolve`, "POST", body);

export type SchemaAliasBackfillStatus =
  | "pending"
  | "running"
  | "exhausted"
  | "completed";

export interface SchemaAliasApplySuccessBody {
  ok: true;
  mode: "apply";
  confirmed: true;
  backfill: {
    status: SchemaAliasBackfillStatus;
    remaining?: number;
    lastProcessedAt?: string;
    dedupeKey?: string;
    enqueued?: boolean;
    code?: "backfill_cpu_budget_exhausted";
    retryable?: boolean;
  };
}

export interface SchemaAliasApplyDryRunBody {
  ok: true;
  mode: "dryRun";
  confirmed?: false;
}

export type SchemaAliasApplyBody =
  | SchemaAliasApplySuccessBody
  | SchemaAliasApplyDryRunBody;

export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}): Promise<AdminMutationResult<SchemaAliasApplyBody>> =>
  call<SchemaAliasApplyBody>(`/schema/aliases`, "POST", body);

export const isSchemaAliasRetryableContinuation = (
  r: AdminMutationResult<SchemaAliasApplyBody>,
): r is AdminMutationOk<SchemaAliasApplySuccessBody> => {
  if (!r.ok || r.status !== 202) return false;
  const body = r.data;
  if (typeof body !== "object" || body === null) return false;
  if (!("mode" in body) || body.mode !== "apply") return false;
  return (
    body.backfill?.status === "exhausted" &&
    body.backfill?.retryable === true &&
    body.backfill?.code === "backfill_cpu_budget_exhausted"
  );
};

export const resolveAdminRequest = (
  noteId: string,
  body: AdminRequestResolveBody,
) =>
  call(
    `/requests/${encodeURIComponent(noteId)}/resolve`,
    "POST",
    body,
  );

export const createMeeting = (body: { title: string; heldOn: string; note?: string | null }) =>
  call(`/meetings`, "POST", body);

export const updateMeeting = (
  sessionId: string,
  body: { title?: string; heldOn?: string; note?: string | null; deletedAt?: string | null },
) => call(`/meetings/${encodeURIComponent(sessionId)}`, "PATCH", body);

export const addAttendance = (sessionId: string, memberId: string) =>
  call(`/meetings/${encodeURIComponent(sessionId)}/attendances`, "POST", {
    memberId,
    attended: true,
  });

export const removeAttendance = (sessionId: string, memberId: string) =>
  call(`/meetings/${encodeURIComponent(sessionId)}/attendances`, "POST", {
    memberId,
    attended: false,
  });

// ---- issue-777: schema alias resolve 履歴 (案 A: /admin/audit?action=schema_diff.alias_assigned) ----

export const SchemaAliasHistoryItemZ = z
  .object({
    auditId: z.string().min(1),
    actorEmail: z.string().nullable(),
    createdAt: z.string().min(1),
    beforeStableKey: z.string().nullable(),
    afterStableKey: z.string().nullable(),
    questionText: z.string().nullable(),
  })
  .strict();
export type SchemaAliasHistoryItem = z.infer<typeof SchemaAliasHistoryItemZ>;

const AppliedFiltersZ = z
  .object({
    action: z.string().nullable(),
    actorEmail: z.string().nullable(),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    limit: z.number(),
  })
  .strict();

export const SchemaAliasHistoryResponseZ = z
  .object({
    ok: z.literal(true),
    items: z.array(SchemaAliasHistoryItemZ),
    nextCursor: z.string().nullable(),
    appliedFilters: AppliedFiltersZ,
  })
  .strict();
export type SchemaAliasHistoryResponse = z.infer<typeof SchemaAliasHistoryResponseZ>;

export interface FetchSchemaAliasHistoryParams {
  actorEmail?: string;
  from?: string;
  to?: string;
  questionTextLike?: string;
  cursor?: string;
}

const SCHEMA_ALIAS_RESOLVE_ACTION = "schema_diff.alias_assigned";
const SCHEMA_ALIAS_HISTORY_LIMIT = 50;

function readStringField(value: unknown, key: string): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = (value as Record<string, unknown>)[key];
    return typeof v === "string" ? v : null;
  }
  return null;
}

function defaultAppliedFilters(): SchemaAliasHistoryResponse["appliedFilters"] {
  return {
    action: SCHEMA_ALIAS_RESOLVE_ACTION,
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    limit: SCHEMA_ALIAS_HISTORY_LIMIT,
  };
}

function normalizeAppliedFilters(value: unknown): SchemaAliasHistoryResponse["appliedFilters"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultAppliedFilters();
  }
  return {
    ...defaultAppliedFilters(),
    ...(value as Partial<SchemaAliasHistoryResponse["appliedFilters"]>),
  };
}

interface AuditRowLike {
  auditId: string;
  actorEmail: string | null;
  createdAt: string;
  maskedBefore: unknown;
  maskedAfter: unknown;
}

function projectAuditRowsToHistory(raw: unknown): SchemaAliasHistoryResponse {
  if (!raw || typeof raw !== "object") {
    return { ok: true, items: [], nextCursor: null, appliedFilters: defaultAppliedFilters() };
  }
  const obj = raw as { items?: unknown; nextCursor?: unknown; appliedFilters?: unknown };
  const items = Array.isArray(obj.items) ? obj.items : [];
  const nextCursor =
    typeof obj.nextCursor === "string" || obj.nextCursor === null
      ? (obj.nextCursor as string | null)
      : null;
  return {
    ok: true,
    items: items
      .filter(
        (row): row is AuditRowLike =>
          Boolean(row) &&
          typeof row === "object" &&
          typeof (row as { auditId?: unknown }).auditId === "string",
      )
      .map((row) => ({
        auditId: row.auditId,
        actorEmail: row.actorEmail,
        createdAt: row.createdAt,
        beforeStableKey: readStringField(row.maskedBefore, "stableKey"),
        afterStableKey: readStringField(row.maskedAfter, "stableKey"),
        questionText:
          readStringField(row.maskedAfter, "questionText") ??
          readStringField(row.maskedBefore, "questionText"),
      })),
    nextCursor,
    appliedFilters: normalizeAppliedFilters(obj.appliedFilters),
  };
}

export async function fetchSchemaAliasHistory(
  params: FetchSchemaAliasHistoryParams = {},
): Promise<SchemaAliasHistoryResponse> {
  const q = new URLSearchParams();
  q.set("action", SCHEMA_ALIAS_RESOLVE_ACTION);
  q.set("limit", String(SCHEMA_ALIAS_HISTORY_LIMIT));
  if (params.actorEmail) q.set("actorEmail", params.actorEmail.toLowerCase());
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.cursor) q.set("cursor", params.cursor);

  const res = await fetch(`/api/admin/audit?${q.toString()}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`fetchSchemaAliasHistory failed: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  const projected = projectAuditRowsToHistory(raw);
  return SchemaAliasHistoryResponseZ.parse(projected);
}
