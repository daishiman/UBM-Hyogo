"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { browserDocument } from "../is-browser";

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * dialog の focus trap（初期 focus / Tab 境界ループ / Esc→onClose / previousFocus 復帰）。
 *
 * `Drawer.tsx` / `SidebarDrawer.tsx` の唯一の trap source（unified-sidebar-shell I-E6）。
 * 画面ごとに trap を再実装すると a11y 回帰の温床になるため、ここへ一本化する。
 *
 * - SSR / 非ブラウザ（`browserDocument()` が undefined）では effect 全体が no-op。
 * - `data-shell-drawer-open` 等の scroll lock / backdrop は dialog 共通の関心ではないため
 *   本 hook には含めず、呼び出し側固有の chrome として外側で実装する。
 */
export function useFocusTrap(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return; // SSR no-op
    const previousFocus =
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const container = ref.current;
    const focusables = container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute("disabled"),
        )
      : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose, ref]);
}
