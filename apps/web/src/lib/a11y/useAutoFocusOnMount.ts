"use client";

import { type RefObject, useEffect } from "react";

/**
 * Focuses the referenced element once on mount.
 *
 * The caller is responsible for adding tabIndex={-1} when focusing a
 * non-interactive element such as a heading. Keep logging effects above this
 * hook call when the observable order matters.
 */
export function useAutoFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options?: FocusOptions,
): void {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true, ...options });
  }, [options, ref]);
}
