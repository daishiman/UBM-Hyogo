// 06b-B: 公開停止/再公開/退会申請のトリガを束ねる panel。
// Lane C: SectionCard へ移行（AC-4）。data-testid / aria-label は I-7 保全。
// 不変条件 #4: 本文編集 UI は配置しない（dialog 子に閉じる）。
// 不変条件 #11: self-service 境界 → URL/参照は /me 系のみ。
// 紐付き TC: TC-U-01..06 / TC-U-12。
"use client";

import { useState } from "react";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import type {
  MeProfileStatusSummary,
  PendingRequests,
} from "@/lib/api/me-types";
import type {
  RequestQueueType,
  VisibilityDesiredState,
} from "@/lib/api/me-requests.types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/layout";
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
  const [visibilityDialogState, setVisibilityDialogState] =
    useState<VisibilityDesiredState | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (rulesConsent !== "consented") {
    return (
      <SectionCard
        aria-label="本人申請"
        data-region="request-action-panel"
        data-testid="request-action-panel-disabled"
        className="danger-zone"
        padding="lg"
        tone="default"
        title="公開の停止・退会"
      >
        <div className="eyebrow" data-tone="danger">DANGER ZONE</div>
        <p>
          会則同意の更新が必要です。Google Form での再回答後にこのパネルを有効化します。
        </p>
      </SectionCard>
    );
  }

  const onSubmitted = () => {
    // refresh は dialog 側で close 前に schedule 済み。parent は local state を持たない。
  };

  // server pending のみを正本にする。楽観的 UI は採用しない。
  const visibilityPending = pendingRequests?.visibility
    ? {
        type: "visibility_request" as const,
        createdAt: pendingRequests.visibility.createdAt,
      }
    : null;
  const deletePending = pendingRequests?.delete
    ? {
        type: "delete_request" as const,
        createdAt: pendingRequests.delete.createdAt,
      }
    : null;

  const showHideButton = publishState === "public";
  const showRepublishButton =
    publishState === "hidden" || publishState === "member_only";

  return (
    <SectionCard
      aria-label="本人申請"
      data-region="request-action-panel"
      data-testid="request-action-panel"
      className="danger-zone"
      padding="lg"
      title="公開の停止・退会"
    >
      <div className="eyebrow" data-tone="danger">DANGER ZONE</div>
      <p className="muted">
        プロフィール公開の停止や退会の申請を行います。送信後は管理者の処理を待つことになります。
      </p>
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
      <div className="btn-row">
        {showHideButton ? (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Icon name="x" />}
            onClick={() => setVisibilityDialogState("hidden")}
            disabled={visibilityPending !== null}
            data-region="visibility-request-dialog"
            data-testid="open-hide-dialog"
          >
            公開を停止する
          </Button>
        ) : null}
        {showRepublishButton ? (
          <Button
            variant="soft"
            size="sm"
            leftIcon={<Icon name="check" />}
            onClick={() => setVisibilityDialogState("public")}
            disabled={visibilityPending !== null}
            data-region="visibility-request-dialog"
            data-testid="open-republish-dialog"
          >
            再公開を申請する
          </Button>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Icon name="x" />}
          onClick={() => setDeleteOpen(true)}
          disabled={deletePending !== null}
          data-region="delete-request-dialog"
          data-testid="open-delete-dialog"
        >
          退会を申請する
        </Button>
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
    </SectionCard>
  );
}
