"use client";

import { useEffect, type RefObject } from "react";

import { browserDocument } from "../lib/is-browser";

export type DismissReason = "pointerdown-outside" | "escape";

export interface UseDismissableOptions {
  readonly enabled?: boolean | undefined;
}

/**
 * ref で囲った領域の外側 pointerdown / Escape を検知して onClose を呼ぶ。
 * I-2: open state は所有しない。呼び出し側の `<details>.open` が正本。
 * I-5: browser API は `browserDocument()` 経由のみ。SSR/Workers では no-op。
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  onClose: (reason: DismissReason) => void,
  options?: UseDismissableOptions,
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const doc = browserDocument();
    if (!doc) return;

    const onPointerDown = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      const target = event.target;
      const NodeCtor = doc.defaultView?.Node;
      if (NodeCtor && target instanceof NodeCtor && element.contains(target)) return;
      onClose("pointerdown-outside");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose("escape");
    };

    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, onClose, ref]);
}
