// 06b-B: pending 申請受付済みを polite に表示する banner。
// 紐付き TC: TC-U-12 / TC-A-05。

import type { RequestQueueType } from "../../../src/lib/api/me-requests.types";

const MESSAGES: Record<RequestQueueType, string> = {
  visibility_request:
    "公開状態の変更申請を受け付けました。管理者の承認後に反映されます。",
  delete_request: "退会申請を受け付けました。管理者の承認後に反映されます。",
};

export interface RequestPendingBannerProps {
  readonly type: RequestQueueType;
  readonly createdAt?: string;
}

export function RequestPendingBanner({ type, createdAt }: RequestPendingBannerProps) {
  return (
    <div role="status" aria-live="polite" data-pending-type={type}>
      <p>{MESSAGES[type]}</p>
      {createdAt ? <p>受付日時: {createdAt}</p> : null}
    </div>
  );
}
