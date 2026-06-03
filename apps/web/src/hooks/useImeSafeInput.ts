"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
} from "react";

export interface UseImeSafeInputOptions {
  value: string;
  onCommit: (value: string) => void;
  debounceMs?: number | undefined;
}

export function useImeSafeInput({
  value,
  onCommit,
  debounceMs = 250,
}: UseImeSafeInputOptions) {
  const [draft, setDraft] = useState(value);
  const composingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current == null) return;
    globalThis.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const scheduleCommit = useCallback(
    (nextValue: string) => {
      clearTimer();
      if (debounceMs === 0) {
        onCommitRef.current(nextValue);
        return;
      }
      timeoutRef.current = globalThis.setTimeout(() => {
        timeoutRef.current = null;
        onCommitRef.current(nextValue);
      }, debounceMs);
    },
    [clearTimer, debounceMs],
  );

  const commitNow = useCallback(
    (nextValue: string) => {
      clearTimer();
      setDraft(nextValue);
      onCommitRef.current(nextValue);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (composingRef.current) return;
    setDraft(value);
  }, [value]);

  useEffect(() => clearTimer, [clearTimer]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setDraft(nextValue);
      if (!composingRef.current) {
        scheduleCommit(nextValue);
      }
    },
    [scheduleCommit],
  );

  const onCompositionStart = useCallback(
    (_event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = true;
      clearTimer();
    },
    [clearTimer],
  );

  const onCompositionEnd = useCallback(
    (event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = false;
      const nextValue = event.currentTarget.value;
      setDraft(nextValue);
      scheduleCommit(nextValue);
    },
    [scheduleCommit],
  );

  return {
    value: draft,
    isComposing: composingRef.current,
    commitNow,
    inputProps: {
      value: draft,
      onChange,
      onCompositionStart,
      onCompositionEnd,
    },
  };
}
