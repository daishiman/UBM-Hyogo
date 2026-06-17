"use client";

// Task E — モバイル用 overlay drawer。role="dialog" aria-modal。Esc / backdrop で close。
// open 時に <body> へ data-shell-drawer-open を付与し scroll lock を CSS 側へ委ねる。
import { useEffect, useRef, type ReactNode } from "react";

import { browserDocument } from "@/lib/is-browser";

export interface SidebarDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

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

  // open 中だけ body へ scroll-lock マーカーを付与。初期 focus を drawer 内へ。
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;
    if (open) {
      doc.body.setAttribute("data-shell-drawer-open", "true");
      const firstLink = panelRef.current?.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      firstLink?.focus();
    } else {
      doc.body.removeAttribute("data-shell-drawer-open");
    }
    return () => doc.body.removeAttribute("data-shell-drawer-open");
  }, [open]);

  if (!open) return null;

  return (
    <div data-shell-block="drawer" className="fixed inset-0 z-40 md:hidden">
      <button
        type="button"
        data-shell-block="drawer-backdrop"
        aria-label="メニューを閉じる"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="サイドバーメニュー"
        data-shell-block="drawer-panel"
        className="absolute inset-y-0 left-0 flex w-[min(17rem,88vw)] flex-col gap-3 overflow-y-auto border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
