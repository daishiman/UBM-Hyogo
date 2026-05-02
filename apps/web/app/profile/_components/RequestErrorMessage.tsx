// 06b-B: code → 文言マッピングを `role=alert` で読み上げ可能に表示する component。
// 紐付き TC: TC-U-11 / TC-A-04。
"use client";

import type { RequestErrorCode } from "../../../src/lib/api/me-requests.types";

const MESSAGES: Record<RequestErrorCode, string> = {
  DUPLICATE_PENDING_REQUEST:
    "既に申請を受け付けています。管理者の対応をお待ちください。",
  INVALID_REQUEST: "入力内容を確認してください。",
  RULES_CONSENT_REQUIRED: "会則同意の更新が必要です。",
  RATE_LIMITED:
    "短時間に申請が集中しています。時間を置いて再度お試しください。",
  UNAUTHORIZED: "ログインが必要です。再度サインインしてください。",
  NETWORK: "通信に失敗しました。再試行してください。",
  SERVER: "サーバーで問題が発生しました。",
};

export interface RequestErrorMessageProps {
  readonly code: RequestErrorCode;
  readonly onRetry?: () => void;
}

export function RequestErrorMessage({ code, onRetry }: RequestErrorMessageProps) {
  const showRetry =
    onRetry !== undefined && (code === "NETWORK" || code === "SERVER");
  return (
    <div role="alert" data-testid="request-error" data-code={code}>
      <p>{MESSAGES[code]}</p>
      {showRetry ? (
        <button type="button" onClick={onRetry}>
          再試行
        </button>
      ) : null}
    </div>
  );
}
