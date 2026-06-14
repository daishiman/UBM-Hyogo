"use client";
// step-07: admin/requests 二段階確認 dialog (HTML5 <dialog>)
// 親 spec: docs/30-workflows/step-07-requests-approve-reject/phase-2-design.md
import { useEffect, useId, useRef, useState } from "react";
import { FormField } from "../ui/FormField";

export type RequestConfirmKind = "approve" | "reject";

export interface RequestConfirmDialogProps {
  readonly kind: RequestConfirmKind | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (note: string) => Promise<void> | void;
  readonly isDestructive?: boolean;
  readonly busy: boolean;
  readonly destructiveMessage?: string;
}

const MAX_NOTE = 500;

export function RequestConfirmDialog({
  kind,
  open,
  onClose,
  onSubmit,
  isDestructive = false,
  busy,
  destructiveMessage,
}: RequestConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open && typeof el.showModal === "function") {
        try {
          el.showModal();
        } catch {
          /* noop: jsdom may not implement */
        }
      }
    } else {
      if (el.open && typeof el.close === "function") {
        el.close();
      }
      setNote("");
      setValidationError(null);
    }
  }, [open]);

  if (!kind) return null;

  const handleSubmit = async () => {
    const trimmed = note.trim();
    if (kind === "reject" && trimmed === "") {
      setValidationError("却下理由を入力してください");
      return;
    }
    if (note.length > MAX_NOTE) {
      setValidationError(`${MAX_NOTE}文字以内で入力してください`);
      return;
    }
    setValidationError(null);
    await onSubmit(trimmed);
  };

  const handleCancel = () => {
    if (busy) return;
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      data-destructive={isDestructive ? "true" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        handleCancel();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <h3 id={titleId}>
        {kind === "approve" ? "申請を承認します" : "申請を却下します"}
      </h3>
      {destructiveMessage && (
        <p role={isDestructive ? "alert" : undefined}>{destructiveMessage}</p>
      )}
      <FormField
        name="resolutionNote"
        label={
          kind === "reject"
            ? "却下理由（必須・最大 500 文字、PII を含めない）"
            : "メモ（任意・最大 500 文字、PII を含めない）"
        }
        required={kind === "reject"}
        {...(validationError ? { error: validationError } : {})}
      >
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value.slice(0, MAX_NOTE));
            setValidationError(null);
          }}
          maxLength={MAX_NOTE}
          rows={3}
        />
      </FormField>
      <div className="btn-row" role="group" aria-label="確認">
        <button type="button" onClick={handleSubmit} disabled={busy}>
          {kind === "approve" ? "承認を実行" : "却下を実行"}
        </button>
        <button type="button" onClick={handleCancel} disabled={busy}>
          キャンセル
        </button>
      </div>
    </dialog>
  );
}
