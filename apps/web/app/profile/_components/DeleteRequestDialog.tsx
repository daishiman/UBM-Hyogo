// 06b-B: 退会申請の二段確認ダイアログ。
// 不変条件 #4: 本文編集禁止 → form field は reason + 不可逆同意 checkbox のみ。
// 紐付き TC: TC-U-09 / TC-U-10 / TC-U-21 / TC-A-06。
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
  requestDelete,
} from "../../../src/lib/api/me-requests";
import {
  REASON_MAX_LENGTH,
  type QueueAccepted,
  type RequestErrorCode,
} from "../../../src/lib/api/me-requests.types";
import { RequestErrorMessage } from "./RequestErrorMessage";

export interface DeleteRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmitted: (accepted: QueueAccepted) => void;
}

export function DeleteRequestDialog({
  open,
  onClose,
  onSubmitted,
}: DeleteRequestDialogProps) {
  const titleId = useId();
  const descId = useId();
  const irreversibleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<RequestErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setConfirmed(false);
    setError(null);
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  const onSubmit = async () => {
    if (!confirmed) return;
    if (reason.length > REASON_MAX_LENGTH) {
      setError("INVALID_REQUEST");
      return;
    }
    setPending(true);
    try {
      const res = await requestDelete(reason.length > 0 ? { reason } : {});
      if (res.ok) {
        onSubmitted(res.accepted);
        onClose();
      } else {
        if (res.code === "DUPLICATE_PENDING_REQUEST") {
          onSubmitted({
            queueId: "existing-pending",
            type: "delete_request",
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
      data-testid="delete-request-dialog"
    >
      <h3 id={titleId}>退会を申請する</h3>
      <p id={descId}>
        退会申請は管理者承認後に取り消せません。承認されるとマイページとアカウントは削除されます。
      </p>
      <p id={irreversibleId} data-irreversible="true">
        ※ この操作は不可逆です。
      </p>
      <label>
        理由（任意・最大 {REASON_MAX_LENGTH} 文字）
        <textarea
          maxLength={REASON_MAX_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={pending}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={pending}
          data-testid="delete-confirm-checkbox"
        />
        不可逆であることを理解した上で退会申請する
      </label>
      {error ? <RequestErrorMessage code={error} onRetry={onSubmit} /> : null}
      <div>
        <button type="button" onClick={onClose} disabled={pending}>
          キャンセル
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || !confirmed}
          aria-describedby={irreversibleId}
          data-testid="delete-submit"
        >
          {pending ? "送信中..." : "退会申請を送信"}
        </button>
      </div>
    </div>
  );
}
