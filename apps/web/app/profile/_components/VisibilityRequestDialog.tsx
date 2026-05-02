// 06b-B: 公開停止 / 再公開申請の確認ダイアログ。
// 不変条件 #4: 本文編集禁止 → form field は desiredState (props 固定) と reason のみ。
// 紐付き TC: TC-U-05..08, TC-U-21, TC-A-01..03。
"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AuthRequiredError,
  requestVisibilityChange,
} from "../../../src/lib/api/me-requests";
import {
  REASON_MAX_LENGTH,
  type QueueAccepted,
  type RequestErrorCode,
  type VisibilityDesiredState,
} from "../../../src/lib/api/me-requests.types";
import { RequestErrorMessage } from "./RequestErrorMessage";

export interface VisibilityRequestDialogProps {
  readonly desiredState: VisibilityDesiredState;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmitted: (accepted: QueueAccepted) => void;
}

export function VisibilityRequestDialog({
  desiredState,
  open,
  onClose,
  onSubmitted,
}: VisibilityRequestDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<RequestErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError(null);
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  const heading =
    desiredState === "hidden" ? "公開を停止する申請" : "再公開を申請する";
  const desc =
    desiredState === "hidden"
      ? "本人の公開停止申請を受け付けます。承認後にマイページから外れます。"
      : "公開停止中のページの再公開を申請します。承認後に再表示されます。";

  const onSubmit = async () => {
    if (reason.length > REASON_MAX_LENGTH) {
      setError("INVALID_REQUEST");
      return;
    }
    setPending(true);
    try {
      const res = await requestVisibilityChange({
        desiredState,
        ...(reason.length > 0 ? { reason } : {}),
      });
      if (res.ok) {
        onSubmitted(res.accepted);
        onClose();
      } else {
        if (res.code === "DUPLICATE_PENDING_REQUEST") {
          onSubmitted({
            queueId: "existing-pending",
            type: "visibility_request",
            status: "pending",
            createdAt: new Date().toISOString(),
          });
        }
        setError(res.code);
      }
    } catch (err) {
      setError(err instanceof AuthRequiredError ? "UNAUTHORIZED" : "SERVER");
    } finally {
      setPending(false);
    }
  };

  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={-1}
      ref={dialogRef}
      onKeyDown={onDialogKeyDown}
      data-testid="visibility-request-dialog"
      data-desired-state={desiredState}
    >
      <h3 id={titleId}>{heading}</h3>
      <p id={descId}>{desc}</p>
      <label>
        理由（任意・最大 {REASON_MAX_LENGTH} 文字）
        <textarea
          maxLength={REASON_MAX_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={pending}
        />
      </label>
      {error ? <RequestErrorMessage code={error} onRetry={onSubmit} /> : null}
      <div>
        <button type="button" onClick={onClose} disabled={pending}>
          キャンセル
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || reason.length > REASON_MAX_LENGTH}
          data-testid="visibility-submit"
        >
          {pending ? "送信中..." : "申請を送信"}
        </button>
      </div>
    </div>
  );
}
