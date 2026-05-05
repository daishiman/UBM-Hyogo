// 06b-B: /api/me/visibility-request, /api/me/delete-request の client helper。
// 不変条件 #5: D1 直接禁止 → 同一 origin の Next.js route handler 経由で API Worker を叩く。
// 不変条件 #11: self-service 境界 → URL に :memberId を含めない。
//   browser は同一 origin /api/me/* route handler を叩き、server 側 proxy が upstream /me/* に転送する。
// 不変条件 #4: 本文編集禁止 → input は desiredState/reason のみ。
//
// 実装メモ:
//   client component から呼び出される helper のため、`next/headers` 依存の
//   `fetchAuthed` は使えない（server-only）。代わりに同一 origin の Next.js
//   route handler `app/api/me/{visibility,delete}-request/route.ts` を経由し、
//   route handler 側で server fetchAuthed が cookie を透過する。
//   ブラウザは same-origin のため credentials は既定で送信される。

import { REASON_MAX_LENGTH } from "./me-requests.types";
import type {
  DeleteRequestInput,
  QueueAccepted,
  RequestErrorCode,
  RequestResult,
  VisibilityRequestInput,
} from "./me-requests.types";

export class AuthRequiredError extends Error {
  constructor(message = "AUTH_REQUIRED") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

const mapStatusToCode = (status: number): RequestErrorCode => {
  if (status === 409) return "DUPLICATE_PENDING_REQUEST";
  if (status === 422) return "INVALID_REQUEST";
  if (status === 403) return "RULES_CONSENT_REQUIRED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER";
  return "SERVER";
};

const isNetworkError = (err: unknown): boolean => {
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const m = err.message ?? "";
    return /fetch failed|network|ECONN|ENOTFOUND/i.test(m);
  }
  return false;
};

const validateReason = (reason: string | undefined): RequestResult | null => {
  if (reason === undefined) return null;
  if (reason.length > REASON_MAX_LENGTH) {
    return { ok: false, code: "INVALID_REQUEST", status: 422 };
  }
  return null;
};

const postQueueRequest = async (
  path: string,
  body: object,
): Promise<RequestResult> => {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (err) {
    if (isNetworkError(err)) {
      return { ok: false, code: "NETWORK" };
    }
    return { ok: false, code: "SERVER" };
  }

  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (res.ok) {
    const accepted = (await res.json()) as QueueAccepted;
    return { ok: true, accepted };
  }
  return { ok: false, code: mapStatusToCode(res.status), status: res.status };
};

export const requestVisibilityChange = async (
  input: VisibilityRequestInput,
): Promise<RequestResult> => {
  const v = validateReason(input.reason);
  if (v) return v;
  // route handler は同一 origin に存在する: app/api/me/visibility-request/route.ts
  return postQueueRequest("/api/me/visibility-request", {
    desiredState: input.desiredState,
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
  });
};

export const requestDelete = async (
  input: DeleteRequestInput = {},
): Promise<RequestResult> => {
  const v = validateReason(input.reason);
  if (v) return v;
  return postQueueRequest(
    "/api/me/delete-request",
    input.reason !== undefined ? { reason: input.reason } : {},
  );
};
