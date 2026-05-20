"use client";

import { useEffect, type RefObject } from "react";

/**
 * Moves focus to ref.current once after mount.
 * Callers own `tabIndex={-1}` when focusing non-interactive headings.
 */
export function useAutoFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T | null>,
): void {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
}
