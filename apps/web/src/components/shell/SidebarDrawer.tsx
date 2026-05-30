"use client";

// unified-sidebar-shell / Task E: モバイル overlay drawer。
// role="dialog" aria-modal、Esc / backdrop click で close、open 時 body scroll lock。
import { useEffect, useRef, type ReactNode } from "react";
import { browserDocument } from "../../lib/is-browser";
import { CloseIcon } from "./icons";

export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc で close。
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // open 時に body scroll lock + 初期 focus を panel 内最初のリンクへ。
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    doc.body.setAttribute("data-shell-drawer-open", "true");
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    return () => {
      doc.body.removeAttribute("data-shell-drawer-open");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="shell-drawer"
      data-shell-block="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーション"
      className="fixed inset-0 z-50 flex md:hidden"
    >
      <button
        type="button"
        data-shell-block="drawer-backdrop"
        aria-label="メニューを閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_oklch,var(--ubm-color-text-primary)_45%,transparent)]"
      />
      <div
        ref={panelRef}
        data-shell-block="drawer-panel"
        className="relative flex h-full w-[17rem] max-w-[85%] flex-col bg-[var(--shell-bar-bg)] shadow-xl"
      >
        <div className="flex justify-end p-2">
          <button
            type="button"
            data-testid="shell-drawer-close"
            data-shell-block="drawer-close"
            onClick={onClose}
            aria-label="メニューを閉じる"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-bg-2)]"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
