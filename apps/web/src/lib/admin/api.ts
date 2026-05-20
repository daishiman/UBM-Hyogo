// 06c: client-side mutation helper。
// 同一 origin の /api/admin/* proxy 経由で backend Worker を叩く。
// 不変条件 #5: web → D1 直接アクセス禁止。本ファイル経由でのみ admin API を呼ぶ。
// 不変条件 #11: profile 本文編集 mutation は本ライブラリに**意図的に存在させない**。
// 不変条件 #13: tag 直接更新 mutation も存在させない（resolveTagQueue のみ）。
import type {
  AdminRequestResolveBody,
  TagQueueResolveBody,
} from "@ubm-hyogo/shared";

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
