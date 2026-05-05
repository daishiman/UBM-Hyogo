// 06b-B: profile 公開停止/再公開・退会申請 client helper
// 不変条件 #5: 直接 API worker を叩かず、必ず /api/me/* proxy 経由。
// 不変条件 #4: 本文編集は扱わない。visibility / delete request のみ。
// 不変条件 #11: memberId は path に出さない。session.memberId のみで解決される。

export type RequestType = "visibility_request" | "delete_request";

export type DesiredVisibilityState = "hidden" | "public";

export interface QueueAcceptedResponse {
  readonly queueId: string;
  readonly type: RequestType;
  readonly status: "pending";
  readonly createdAt: string;
}

export type SelfRequestErrorCode =
  | "DUPLICATE_PENDING_REQUEST"
  | "RULES_CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "UNAUTHENTICATED"
  | "INVALID_REQUEST"
  | "UNKNOWN";

export class SelfRequestError extends Error {
  readonly status: number;
  readonly code: SelfRequestErrorCode;
  constructor(status: number, code: SelfRequestErrorCode, message?: string) {
    super(message ?? code);
    this.name = "SelfRequestError";
    this.status = status;
    this.code = code;
  }
}

const codeFromStatus = (
  status: number,
  body: { code?: unknown } | null,
): SelfRequestErrorCode => {
  const raw = typeof body?.code === "string" ? body.code : "";
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 409 && raw === "DUPLICATE_PENDING_REQUEST")
    return "DUPLICATE_PENDING_REQUEST";
  if (status === 403 && raw === "RULES_CONSENT_REQUIRED")
    return "RULES_CONSENT_REQUIRED";
  if (status === 429) return "RATE_LIMITED";
  if (status === 422) return "INVALID_REQUEST";
  return "UNKNOWN";
};

const postJson = async (
  path: string,
  body: unknown,
): Promise<QueueAcceptedResponse> => {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "same-origin",
  });
  const text = await res.text().catch(() => "");
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (res.status === 202 && parsed && typeof parsed === "object") {
    return parsed as QueueAcceptedResponse;
  }
  const code = codeFromStatus(
    res.status,
    parsed && typeof parsed === "object"
      ? (parsed as { code?: unknown })
      : null,
  );
  throw new SelfRequestError(res.status, code);
};

export interface VisibilityRequestInput {
  readonly desiredState: DesiredVisibilityState;
  readonly reason?: string;
}

export const requestVisibilityChange = (
  input: VisibilityRequestInput,
): Promise<QueueAcceptedResponse> =>
  postJson("/api/me/visibility-request", input);

export interface DeleteRequestInput {
  readonly reason?: string;
}

export const requestAccountDeletion = (
  input: DeleteRequestInput = {},
): Promise<QueueAcceptedResponse> =>
  postJson("/api/me/delete-request", input);
