// 06b-B: /me/visibility-request, /me/delete-request の helper 用 type 定義。
// API Worker 側 zod schema と field-by-field 1:1 同期（drift 検出は phase-09 typecheck）。
// 不変条件 #5: D1 直接 import なし。type 定義のみ。

export type VisibilityDesiredState = "hidden" | "public";

export interface VisibilityRequestInput {
  readonly desiredState: VisibilityDesiredState;
  readonly reason?: string;
}

export interface DeleteRequestInput {
  readonly reason?: string;
}

export type RequestQueueType = "visibility_request" | "delete_request";

export interface QueueAccepted {
  readonly queueId: string;
  readonly type: RequestQueueType;
  readonly status: "pending";
  readonly createdAt: string;
}

// HTTP / fetch 例外を UI 表示用 code に正規化したもの。
export type RequestErrorCode =
  | "DUPLICATE_PENDING_REQUEST"
  | "INVALID_REQUEST"
  | "RULES_CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "NETWORK"
  | "SERVER";

export type RequestResult =
  | { readonly ok: true; readonly accepted: QueueAccepted }
  | { readonly ok: false; readonly code: RequestErrorCode; readonly status?: number };

export const REASON_MAX_LENGTH = 500;
