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
    return { ok: false, status: res.status, error: err };
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

export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}) => call(`/schema/aliases`, "POST", body);

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

export const addAttendance = (sessionId: string, memberId: string) =>
  call(`/meetings/${encodeURIComponent(sessionId)}/attendance`, "POST", { memberId });

export const removeAttendance = (sessionId: string, memberId: string) =>
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
    "DELETE",
  );
