// 06b-B: 公開停止 / 再公開申請の UI。
// 不変条件 #4: 本文編集 UI は配置しない。reason 入力欄も置かず Modal の確認のみ。
// 不変条件 #5: API は /api/me/visibility-request proxy 経由。

"use client";

import { useState } from "react";
import { Button } from "../../../src/components/ui/Button";
import { Modal } from "../../../src/components/ui/Modal";
import {
  requestVisibilityChange,
  SelfRequestError,
  type DesiredVisibilityState,
} from "../../../src/lib/api/me-requests-client";
import type { MeProfileStatusSummary } from "../../../src/lib/api/me-types";

export interface VisibilityRequestProps {
  readonly publishState: MeProfileStatusSummary["publishState"];
  readonly disabled?: boolean;
}

type Phase = "idle" | "confirm" | "submitting" | "accepted" | "error";

const desiredFor = (
  state: MeProfileStatusSummary["publishState"],
): DesiredVisibilityState => (state === "hidden" ? "public" : "hidden");

const triggerLabel = (
  state: MeProfileStatusSummary["publishState"],
): string => (state === "hidden" ? "再公開を申請する" : "公開停止を申請する");

const confirmTitle = (desired: DesiredVisibilityState): string =>
  desired === "hidden"
    ? "公開停止を申請しますか？"
    : "再公開を申請しますか？";

const errorMessage = (err: SelfRequestError): string => {
  switch (err.code) {
    case "DUPLICATE_PENDING_REQUEST":
      return "既に同じ申請を受け付け中です。運営の対応をお待ちください。";
    case "RULES_CONSENT_REQUIRED":
      return "利用規約への同意が必要です。最新の Google Form から再同意してください。";
    case "RATE_LIMITED":
      return "短時間に申請が集中しました。しばらく待って再度お試しください。";
    case "UNAUTHENTICATED":
      return "セッションが切れました。再ログインしてください。";
    case "INVALID_REQUEST":
      return "申請内容に不備があります。";
    default:
      return "申請に失敗しました。時間を置いて再度お試しください。";
  }
};

export function VisibilityRequest({
  publishState,
  disabled = false,
}: VisibilityRequestProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<SelfRequestError | null>(null);
  const desired = desiredFor(publishState);

  const onConfirm = async () => {
    setError(null);
    setPhase("submitting");
    try {
      await requestVisibilityChange({ desiredState: desired });
      setPhase("accepted");
    } catch (err) {
      const e =
        err instanceof SelfRequestError
          ? err
          : new SelfRequestError(0, "UNKNOWN");
      setError(e);
      setPhase("error");
    }
  };

  const closeModal = () => {
    if (phase === "submitting") return;
    setPhase("idle");
    setError(null);
  };

  return (
    <section aria-label="公開状態の申請">
      <h2>公開状態の申請</h2>
      {phase === "accepted" ? (
        <p role="status" data-tone="success">
          {desired === "hidden"
            ? "公開停止の申請を受け付けました。運営の確認をお待ちください。"
            : "再公開の申請を受け付けました。運営の確認をお待ちください。"}
        </p>
      ) : (
        <p>
          現在の公開状態に対して
          {publishState === "hidden" ? "再公開" : "公開停止"}
          を申請できます。承認は運営側で行われます。
        </p>
      )}
      <Button
        type="button"
        data-cta="visibility-request-trigger"
        disabled={disabled || phase === "accepted"}
        onClick={() => setPhase("confirm")}
      >
        {triggerLabel(publishState)}
      </Button>

      <Modal
        open={phase === "confirm" || phase === "submitting" || phase === "error"}
        onClose={closeModal}
        title={confirmTitle(desired)}
      >
        <p>
          申請後、運営が内容を確認して反映します。本人による即時切替は行われません。
        </p>
        {phase === "error" && error ? (
          <p role="alert" data-tone="error">
            {errorMessage(error)}
          </p>
        ) : null}
        <Button
          type="button"
          data-cta="visibility-request-confirm"
          loading={phase === "submitting"}
          disabled={phase === "submitting"}
          onClick={onConfirm}
        >
          {phase === "submitting" ? "申請中…" : "申請する"}
        </Button>
        <Button
          type="button"
          data-cta="visibility-request-cancel"
          disabled={phase === "submitting"}
          onClick={closeModal}
        >
          キャンセル
        </Button>
      </Modal>
    </section>
  );
}
