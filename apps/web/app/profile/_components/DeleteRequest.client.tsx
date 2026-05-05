// 06b-B: 退会（アカウント削除）申請の UI。
// 不変条件 #4: 本文編集 UI は配置しない。reason 入力欄も置かず Modal の確認のみ。
// 不変条件 #5: API は /api/me/delete-request proxy 経由。

"use client";

import { useState } from "react";
import { Button } from "../../../src/components/ui/Button";
import { Modal } from "../../../src/components/ui/Modal";
import {
  requestAccountDeletion,
  SelfRequestError,
} from "../../../src/lib/api/me-requests-client";

export interface DeleteRequestProps {
  readonly disabled?: boolean;
}

type Phase = "idle" | "confirm" | "submitting" | "accepted" | "error";

const errorMessage = (err: SelfRequestError): string => {
  switch (err.code) {
    case "DUPLICATE_PENDING_REQUEST":
      return "既に退会申請を受け付け中です。運営の対応をお待ちください。";
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

export function DeleteRequest({ disabled = false }: DeleteRequestProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<SelfRequestError | null>(null);

  const onConfirm = async () => {
    setError(null);
    setPhase("submitting");
    try {
      await requestAccountDeletion();
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
    <section aria-label="退会の申請">
      <h2>退会（アカウント削除）の申請</h2>
      {phase === "accepted" ? (
        <p role="status" data-tone="success">
          退会申請を受け付けました。運営の確認後にアカウントが削除されます。
        </p>
      ) : (
        <p>
          退会を希望する場合は申請してください。承認後にアカウントが削除されます。本操作は取り消しできません。
        </p>
      )}
      <Button
        type="button"
        data-cta="delete-request-trigger"
        disabled={disabled || phase === "accepted"}
        onClick={() => setPhase("confirm")}
      >
        退会を申請する
      </Button>

      <Modal
        open={phase === "confirm" || phase === "submitting" || phase === "error"}
        onClose={closeModal}
        title="退会を申請しますか？"
      >
        <p>
          退会申請は運営が確認後に反映され、アカウントは復元できません。本当に申請しますか？
        </p>
        {phase === "error" && error ? (
          <p role="alert" data-tone="error">
            {errorMessage(error)}
          </p>
        ) : null}
        <Button
          type="button"
          data-cta="delete-request-confirm"
          loading={phase === "submitting"}
          disabled={phase === "submitting"}
          onClick={onConfirm}
        >
          {phase === "submitting" ? "申請中…" : "退会を申請する"}
        </Button>
        <Button
          type="button"
          data-cta="delete-request-cancel"
          disabled={phase === "submitting"}
          onClick={closeModal}
        >
          キャンセル
        </Button>
      </Modal>
    </section>
  );
}
