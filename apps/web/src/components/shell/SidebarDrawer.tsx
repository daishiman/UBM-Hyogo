"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useFocusTrap } from "../../lib/a11y/useFocusTrap";
import { browserDocument } from "../../lib/is-browser";

export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** sidebar 本体（brand + nav + footer）と同一ツリーを受け取る。 */
  children: ReactNode;
};

/**
 * mobile（`< md`）の overlay drawer（Task E）。
 *
 * focus trap（初期 focus / Tab ループ / Esc→onClose / previousFocus 復帰）は
 * `useFocusTrap` 単一 source へ委譲し、本 component には再実装しない（I-E6）。
 * SidebarDrawer 固有の chrome は (a) scroll lock 属性、(b) backdrop click、
 * (c) `md:hidden` wrapper、(d) token 幅・背景 のみ。
 */
export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // focus trap は単一 source へ委譲（AC-E4 / AC-E6 / I-E6）。
  useFocusTrap(open, onClose, dialogRef);

  // scroll lock は属性 + CSS（globals.css の body[data-shell-drawer-open]）で実現（AC-E5）。
  // body.style.overflow を JS で直書きしない（hydration mismatch 回避）。
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    doc.body.setAttribute("data-shell-drawer-open", "true");
    return () => doc.body.removeAttribute("data-shell-drawer-open");
  }, [open]);

  if (!open) return null; // AC-E11 / unmount

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* backdrop: onClick のみ・aria-hidden。panel は兄弟のため click 伝播しない（AC-E4） */}
      <div
        className="absolute inset-0 bg-[var(--shell-overlay)]"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="サイドバーメニュー"
        className="absolute inset-y-0 left-0 flex w-[var(--shell-bar-w)] flex-col overflow-y-auto border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)]"
      >
        {children}
      </div>
    </div>
  );
}
