"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAdminMutation } from "../../hooks";
import { Button } from "../../../../components/ui/Button";
import { Textarea } from "../../../../components/ui/Textarea";

export interface NoteFormProps {
  readonly memberId: string;
  readonly initialBody?: string;
  readonly noteId?: string;
  readonly onSuccess?: () => void | Promise<void>;
  readonly onCancel?: () => void;
}

function validate(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length < 1) return "本文は必須です";
  if (body.length > 2000) return "2000文字以内にしてください";
  return null;
}

export function NoteForm({
  memberId,
  initialBody,
  noteId,
  onSuccess,
  onCancel,
}: NoteFormProps) {
  const [body, setBody] = useState(initialBody ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = Boolean(noteId);
  const endpoint = isEdit
    ? `/api/admin/members/${encodeURIComponent(memberId)}/notes/${encodeURIComponent(noteId ?? "")}`
    : `/api/admin/members/${encodeURIComponent(memberId)}/notes`;
  const method: "POST" | "PATCH" = isEdit ? "PATCH" : "POST";

  const { trigger, isLoading } = useAdminMutation(endpoint, method, {
    onSuccess: async () => {
      setBody("");
      await onSuccess?.();
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate(body);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    try {
      await trigger({ body });
    } catch {
      // toast emitted by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="note-body" className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
        メモ本文
      </label>
      <Textarea
        id="note-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-invalid={validationError ? "true" : undefined}
        {...(validationError ? { describedBy: "note-body-error" } : {})}
        disabled={isLoading}
        rows={4}
        maxLength={2000}
      />
      {validationError ? (
        <p
          id="note-body-error"
          role="alert"
          className="text-sm text-[var(--ubm-color-danger)]"
        >
          {validationError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={isLoading} loading={isLoading}>
          {isEdit ? "更新" : "追加"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            キャンセル
          </Button>
        ) : null}
      </div>
    </form>
  );
}
