"use client";
// serial-05 step-06: useConfirmDialog 用の presentational 部品。
// state は持たず、props 駆動で表示・aria 属性・ESC ハンドリングのみを行う。
import { useEffect, useId, useRef } from "react";
import { browserDocument } from "../../lib/is-browser";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string | undefined;
  readonly confirmLabel: string;
  readonly cancelLabel?: string | undefined;
  readonly isDestructive?: boolean | undefined;
  readonly note?: string | undefined;
  readonly onNoteChange?: ((note: string) => void) | undefined;
  readonly noteRequired?: boolean | undefined;
  readonly maxNoteLength?: number | undefined;
  readonly validationError?: string | null | undefined;
  readonly submitting?: boolean | undefined;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDestructive,
  note,
  onNoteChange,
  noteRequired,
  maxNoteLength,
  validationError,
  submitting,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    const previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onCancel();
      }
      if (e.key !== "Tab" || !dialog) return;

      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    doc.addEventListener("keydown", handler);
    return () => {
      doc.removeEventListener("keydown", handler);
      previousFocus?.focus();
    };
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const descId = description ? descriptionId : undefined;

  return (
    <div
      role="presentation"
      className="ubm-confirm-backdrop"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className="ubm-confirm-dialog"
      >
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descId}>{description}</p> : null}
        {onNoteChange ? (
          <label>
            理由{noteRequired ? "（必須）" : "（任意）"}
            <textarea
              value={note ?? ""}
              onChange={(e) => onNoteChange(e.target.value)}
              maxLength={maxNoteLength}
              aria-invalid={validationError ? "true" : "false"}
            />
          </label>
        ) : null}
        {validationError ? (
          <p role="alert" className="ubm-confirm-error">
            {validationError}
          </p>
        ) : null}
        <div>
          <button type="button" onClick={onCancel} disabled={submitting}>
            {cancelLabel ?? "キャンセル"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            data-destructive={isDestructive ? "true" : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
