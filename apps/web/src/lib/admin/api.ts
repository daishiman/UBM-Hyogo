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

// Issue #55: member の通知 opt-out 切替
export const patchMemberNotificationPref = (
  memberId: string,
  body: { notificationOptOut: boolean },
) =>
  call(
    `/members/${encodeURIComponent(memberId)}/notification-pref`,
    "PATCH",
    body,
  );

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
  alias?: {
    id: string;
    revisionId: string;
    aliasQuestionId: string;
    aliasLabel: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    version: number;
  };
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

export interface RollbackSchemaAliasInput {
  aliasId: string;
  version: number;
  reason?: string;
}

export interface RollbackSchemaAliasResult {
  aliasId: string;
  rolledBackAt: string;
  relatedAuditId: string | null;
  newVersion: number;
  impact: {
    affectedResponseCount: number;
    recomputeRequired: boolean;
  };
}

export const BULK_ROLLBACK_MAX_ROWS = 50;

export class RollbackApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? `${code} (status ${status})`);
    this.status = status;
    this.code = code;
    this.name = "RollbackApiError";
  }
}

export async function rollbackSchemaAlias(
  input: RollbackSchemaAliasInput,
): Promise<RollbackSchemaAliasResult> {
  let res: Response;
  try {
    res = await fetch(
      `/api/admin/schema/aliases/${encodeURIComponent(input.aliasId)}/rollback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "If-Match": `version=${input.version}`,
        },
        body: JSON.stringify({ reason: input.reason }),
      },
    );
  } catch (e) {
    throw new RollbackApiError(0, "network_error", e instanceof Error ? e.message : "network error");
  }
  let body: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : "unknown";
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : undefined;
    throw new RollbackApiError(res.status, code, message);
  }
  return body as RollbackSchemaAliasResult;
}

export interface SchemaAliasRollbackBulkRow {
  aliasId: string;
  version: number;
  reason?: string;
}

export interface SchemaAliasRollbackBulkRowResult {
  aliasId: string;
  status: "success" | "error";
  data?: RollbackSchemaAliasResult;
  error?: {
    kind: "version_mismatch" | "not_found" | "forbidden" | "network" | "other";
    message: string;
    httpStatus?: number;
  };
}

export interface SchemaAliasRollbackBulkOptions {
  onRowResult?: (result: SchemaAliasRollbackBulkRowResult, index: number) => void;
  concurrency?: number;
}

const rollbackErrorKind = (
  error: RollbackApiError,
): NonNullable<SchemaAliasRollbackBulkRowResult["error"]>["kind"] => {
  if (error.status === 409) return "version_mismatch";
  if (error.status === 404) return "not_found";
  if (error.status === 401 || error.status === 403) return "forbidden";
  if (error.status === 0) return "network";
  return "other";
};

// Issue #836: schema alias recompute（rollback 後の reverse-backfill）helper。
// 不変条件 #5/#12: web → API fetch のみ。D1 直接アクセスなし。triggerKey は送らない（server 導出）。
export interface RecomputeSchemaAliasInput {
  aliasId: string;
  reason?: string;
}

export interface RecomputeSchemaAliasResult {
  jobId: string;
  aliasId: string;
  status: "completed" | "running";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  recomputeAuditId: string;
  relatedRollbackAuditId: string | null;
}

export interface RecomputeStatusResult {
  jobId: string;
  aliasId: string;
  status: "pending" | "running" | "completed" | "failed";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  lastError: string | null;
  updatedAt: string;
}

export class RecomputeApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? `${code} (status ${status})`);
    this.status = status;
    this.code = code;
    this.name = "RecomputeApiError";
  }
}

export async function recomputeSchemaAlias(
  input: RecomputeSchemaAliasInput,
): Promise<RecomputeSchemaAliasResult> {
  let res: Response;
  try {
    res = await fetch(
      `/api/admin/schema/aliases/${encodeURIComponent(input.aliasId)}/recompute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: input.reason }),
      },
    );
  } catch (e) {
    throw new RecomputeApiError(
      0,
      "network_error",
      e instanceof Error ? e.message : "network error",
    );
  }
  let body: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : "unknown";
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : undefined;
    throw new RecomputeApiError(res.status, code, message);
  }
  return body as RecomputeSchemaAliasResult;
}

export async function getSchemaAliasRecomputeStatus(
  aliasId: string,
): Promise<RecomputeStatusResult | null> {
  let res: Response;
  try {
    res = await fetch(
      `/api/admin/schema/aliases/${encodeURIComponent(aliasId)}/recompute`,
      { method: "GET" },
    );
  } catch (e) {
    throw new RecomputeApiError(
      0,
      "network_error",
      e instanceof Error ? e.message : "network error",
    );
  }
  let body: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : "unknown";
    throw new RecomputeApiError(res.status, code);
  }
  if (body === null) return null;
  return body as RecomputeStatusResult;
}

// Issue #776: schema alias bulk resolve — client-side bounded fan-out helper.
// 不変条件: 既存 endpoint surface (POST /admin/schema/aliases) のみを使用する。
// `postSchemaAlias` / `isSchemaAliasRetryableContinuation` を変更せず薄い wrapper として共存する。

export interface SchemaAliasBulkRowResult {
  diffId: string;
  questionId: string;
  status: "success" | "retryable" | "error";
  data?: SchemaAliasApplyBody;
  error?: {
    kind: "conflict" | "invalid" | "retryable" | "network" | "other";
    message: string;
    httpStatus?: number;
  };
}

export interface SchemaAliasBulkOptions {
  onRowResult?: (result: SchemaAliasBulkRowResult, index: number) => void;
}

async function runWithConcurrency<T, R>(
  items: ReadonlyArray<T>,
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const effectiveLimit = Math.max(1, Math.min(limit, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers: Promise<void>[] = [];
  for (let w = 0; w < effectiveLimit; w++) {
    workers.push(
      (async () => {
        while (true) {
          const current = nextIndex++;
          if (current >= items.length) return;
          results[current] = await fn(items[current], current);
        }
      })(),
    );
  }
  await Promise.all(workers);
  return results;
}

export const postSchemaAliasBulk = async (
  rows: ReadonlyArray<{ diffId: string; questionId: string; stableKey: string }>,
  options: SchemaAliasBulkOptions = {},
): Promise<{ results: SchemaAliasBulkRowResult[] }> => {
  if (rows.length === 0) return { results: [] };
  const results = await runWithConcurrency(rows, 8, async (row, index) => {
    let result: SchemaAliasBulkRowResult;
    try {
      const r = await postSchemaAlias({
        diffId: row.diffId,
        questionId: row.questionId,
        stableKey: row.stableKey.trim(),
      });
      if (isSchemaAliasRetryableContinuation(r)) {
        result = {
          diffId: row.diffId,
          questionId: row.questionId,
          status: "retryable" as const,
          data: r.data,
          error: {
            kind: "retryable" as const,
            message: "Back-fill can continue from the last processed row.",
            httpStatus: 202,
          },
        };
      } else if (r.ok) {
        result = {
          diffId: row.diffId,
          questionId: row.questionId,
          status: "success" as const,
          data: r.data,
        };
      } else {
        const kind: "conflict" | "invalid" | "network" | "other" =
          r.status === 409
            ? "conflict"
            : r.status === 422
              ? "invalid"
              : r.status === 0
                ? "network"
                : "other";
        result = {
          diffId: row.diffId,
          questionId: row.questionId,
          status: "error" as const,
          error: { kind, message: r.error ?? "", httpStatus: r.status },
        };
      }
    } catch (e) {
      result = {
        diffId: row.diffId,
        questionId: row.questionId,
        status: "error" as const,
        error: {
          kind: "network" as const,
          message: e instanceof Error ? e.message : String(e),
        },
      };
    }
    options.onRowResult?.(result, index);
    return result;
  });
  return { results };
};

// Issue #837: schema alias bulk rollback — existing single rollback endpoint only.
// Each row is committed independently by the server-side single rollback workflow.
export const rollbackSchemaAliasBulk = async (
  rows: ReadonlyArray<SchemaAliasRollbackBulkRow>,
  options: SchemaAliasRollbackBulkOptions = {},
): Promise<{ results: SchemaAliasRollbackBulkRowResult[] }> => {
  if (rows.length === 0) return { results: [] };
  if (rows.length > BULK_ROLLBACK_MAX_ROWS) {
    throw new RollbackApiError(
      0,
      "bulk_limit_exceeded",
      `bulk rollback supports at most ${BULK_ROLLBACK_MAX_ROWS} rows`,
    );
  }
  const results = await runWithConcurrency(rows, options.concurrency ?? 8, async (row, index) => {
    let result: SchemaAliasRollbackBulkRowResult;
    try {
      const data = await rollbackSchemaAlias(row);
      result = {
        aliasId: row.aliasId,
        status: "success",
        data,
      };
    } catch (e) {
      if (e instanceof RollbackApiError) {
        result = {
          aliasId: row.aliasId,
          status: "error",
          error: {
            kind: rollbackErrorKind(e),
            message: e.message,
            httpStatus: e.status,
          },
        };
      } else {
        result = {
          aliasId: row.aliasId,
          status: "error",
          error: {
            kind: "network",
            message: e instanceof Error ? e.message : String(e),
          },
        };
      }
    }
    options.onRowResult?.(result, index);
    return result;
  });
  return { results };
};

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
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
    "DELETE",
  );

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
