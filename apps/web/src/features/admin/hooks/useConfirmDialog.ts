"use client";
// serial-05 step-06: 確認 dialog 用の汎用 hook。
// state（open/kind/note/submitting/validationError/context）と
// submit orchestration（validation → submitting → onSubmit → reset/keep）のみを担い、
// 表示は ConfirmDialog (presentational) に分離する。
import { useCallback, useEffect, useRef, useState } from "react";

export type ConfirmKind = "approve" | "reject" | "delete" | "remove";

export interface UseConfirmDialogOptions {
  readonly requireNote?: boolean;
  readonly maxNoteLength?: number;
  /** dialog close（キャンセル）時に進行中 mutation を止めるコールバック（例: `useAdminMutation().abort`）。 */
  readonly onCancelMutation?: () => void;
}

export interface UseConfirmDialogState {
  readonly open: boolean;
  readonly kind: ConfirmKind | null;
  readonly note: string;
  readonly submitting: boolean;
  readonly validationError: string | null;
  readonly context: unknown;
}

export interface UseConfirmDialogReturn extends UseConfirmDialogState {
  readonly openConfirm: (kind: ConfirmKind, ctx?: unknown) => void;
  readonly closeConfirm: () => void;
  readonly setNote: (note: string) => void;
  readonly submit: () => Promise<void>;
}

const INITIAL: UseConfirmDialogState = {
  open: false,
  kind: null,
  note: "",
  submitting: false,
  validationError: null,
  context: null,
};

export function useConfirmDialog(
  onSubmit: (kind: ConfirmKind, note: string, context: unknown) => Promise<void>,
  options: UseConfirmDialogOptions = {},
): UseConfirmDialogReturn {
  const [state, setState] = useState<UseConfirmDialogState>(INITIAL);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);
  const onCancelMutationRef = useRef(options.onCancelMutation);
  useEffect(() => {
    onCancelMutationRef.current = options.onCancelMutation;
  }, [options.onCancelMutation]);

  const requireNoteOpt = options.requireNote;
  const maxNoteLengthOpt = options.maxNoteLength;

  const validate = useCallback(
    (kind: ConfirmKind, note: string): string | null => {
      const requireNote = requireNoteOpt ?? kind === "reject";
      if (requireNote && note.trim() === "") {
        return "理由を入力してください";
      }
      const max = maxNoteLengthOpt ?? 500;
      if (note.length > max) {
        return `${max}文字以内で入力してください`;
      }
      return null;
    },
    [requireNoteOpt, maxNoteLengthOpt],
  );

  const openConfirm = useCallback((kind: ConfirmKind, ctx?: unknown) => {
    setState({ ...INITIAL, open: true, kind, context: ctx ?? null });
  }, []);

  const closeConfirm = useCallback(() => {
    setState((s) => {
      if (s.submitting) {
        // submit 中の close = 明示キャンセル。進行中 mutation を abort して dialog も閉じる。
        onCancelMutationRef.current?.();
        return INITIAL;
      }
      return s.open ? INITIAL : s;
    });
  }, []);

  const setNote = useCallback((note: string) => {
    setState((s) => ({ ...s, note, validationError: null }));
  }, []);

  const submit = useCallback(async () => {
    // submit 開始時の最新 state を参照するため、setState(updater) で snapshot を取得する
    let snapshot: UseConfirmDialogState | null = null;
    setState((s) => {
      snapshot = s;
      return s;
    });
    const current = snapshot ?? state;
    const { kind, note, context, submitting } = current;
    if (submitting) return;
    if (!kind) return;
    const err = validate(kind, note);
    if (err) {
      setState((s) => ({ ...s, validationError: err }));
      return;
    }
    setState((s) => ({ ...s, submitting: true, validationError: null }));
    try {
      await onSubmitRef.current(kind, note, context);
      setState(INITIAL);
    } catch {
      setState((s) => ({ ...s, submitting: false }));
    }
  }, [state, validate]);

  return {
    ...state,
    openConfirm,
    closeConfirm,
    setNote,
    submit,
  };
}
