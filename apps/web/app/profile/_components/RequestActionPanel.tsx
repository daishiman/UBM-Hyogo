// 06b-B: 公開停止/再公開/退会申請のトリガを束ねる panel。
// 不変条件 #4: 本文編集 UI は配置しない（dialog 子に閉じる）。
// 不変条件 #11: self-service 境界 → URL/参照は /me 系のみ。
// 紐付き TC: TC-U-01..06 / TC-U-12。
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import type {
  MeProfileStatusSummary,
  PendingRequests,
} from "../../../src/lib/api/me-types";
import type {
  QueueAccepted,
  RequestQueueType,
  VisibilityDesiredState,
} from "../../../src/lib/api/me-requests.types";
import { VisibilityRequestDialog } from "./VisibilityRequestDialog";
import { DeleteRequestDialog } from "./DeleteRequestDialog";
import { RequestPendingBanner } from "./RequestPendingBanner";

export interface RequestActionPanelProps {
  readonly publishState: MeProfileStatusSummary["publishState"];
  readonly rulesConsent: MeProfileStatusSummary[typeof STABLE_KEY.rulesConsent];
  /**
   * 06b-followup-001 (#428): server-side pending state。
   * reload 後も banner を sticky 表示するための正本（S1）。
   */
  readonly pendingRequests?: PendingRequests;
}

export function RequestActionPanel({
  publishState,
  rulesConsent,
  pendingRequests,
}: RequestActionPanelProps) {
  const router = useRouter();
  const [visibilityDialogState, setVisibilityDialogState] =
    useState<VisibilityDesiredState | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [optimistic, setOptimistic] = useState<{
    type: RequestQueueType;
    createdAt: string;
  } | null>(null);

  if (rulesConsent !== "consented") {
    return (
      <section aria-label="本人申請" data-testid="request-action-panel-disabled">
        <h2>本人による申請</h2>
        <p>
          会則同意の更新が必要です。Google Form での再回答後にこのパネルを有効化します。
        </p>
      </section>
    );
  }

  const onSubmitted = (accepted: QueueAccepted) => {
    setOptimistic({ type: accepted.type, createdAt: accepted.createdAt });
    // server pending を fetch し直して durable な banner を表示する（S1）
    router.refresh();
  };

  // server pending を最優先（S1）。submit 直後の体感のため optimistic を fallback として併用。
  const visibilityPending = pendingRequests?.visibility
    ? {
        type: "visibility_request" as const,
        createdAt: pendingRequests.visibility.createdAt,
      }
    : optimistic?.type === "visibility_request"
      ? optimistic
      : null;
  const deletePending = pendingRequests?.delete
    ? {
        type: "delete_request" as const,
        createdAt: pendingRequests.delete.createdAt,
      }
    : optimistic?.type === "delete_request"
      ? optimistic
      : null;

  const showHideButton = publishState === "public";
  const showRepublishButton =
    publishState === "hidden" || publishState === "member_only";

  return (
    <section aria-label="本人申請" data-testid="request-action-panel">
      <h2>本人による申請</h2>
      {visibilityPending ? (
        <RequestPendingBanner
          type={visibilityPending.type}
          createdAt={visibilityPending.createdAt}
        />
      ) : null}
      {deletePending ? (
        <RequestPendingBanner
          type={deletePending.type}
          createdAt={deletePending.createdAt}
        />
      ) : null}
      <div>
        {showHideButton ? (
          <button
            type="button"
            onClick={() => setVisibilityDialogState("hidden")}
            disabled={visibilityPending !== null}
            data-testid="open-hide-dialog"
          >
            公開を停止する
          </button>
        ) : null}
        {showRepublishButton ? (
          <button
            type="button"
            onClick={() => setVisibilityDialogState("public")}
            disabled={visibilityPending !== null}
            data-testid="open-republish-dialog"
          >
            再公開を申請する
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={deletePending !== null}
          data-testid="open-delete-dialog"
        >
          退会を申請する
        </button>
      </div>
      <VisibilityRequestDialog
        desiredState={visibilityDialogState ?? "hidden"}
        open={visibilityDialogState !== null}
        onClose={() => setVisibilityDialogState(null)}
        onSubmitted={onSubmitted}
      />
      <DeleteRequestDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSubmitted={onSubmitted}
      />
    </section>
  );
}
