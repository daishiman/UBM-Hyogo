"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { browserDocument } from "@/lib/is-browser";

export type SidebarDrawerProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    previousFocusRef.current =
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    doc.body.dataset.shellDrawerOpen = "true";
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("keydown", onKeyDown);
      delete doc.body.dataset.shellDrawerOpen;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const trapFocus = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const node = dialogRef.current;
    const doc = browserDocument();
    if (!node || !doc) return;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!open) return null;

  return (
    <div
      data-component="shell-drawer-backdrop"
      className="fixed inset-0 z-50 md:hidden"
    >
      <button
        type="button"
        aria-label="サイドバーを閉じる"
        className="absolute inset-0 h-full w-full bg-[var(--ubm-color-text-primary)] opacity-40"
        onClick={onClose}
      />
      <div
        id="shell-drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        data-component="shell-drawer"
        className="relative flex h-full w-[min(22rem,calc(100vw-3rem))] flex-col gap-3 border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 shadow-lg"
        onKeyDown={trapFocus}
      >
        <h2 id={headingId} className="sr-only">
          サイドバー
        </h2>
        {children}
      </div>
    </div>
  );
}
