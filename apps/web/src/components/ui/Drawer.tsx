"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { useFocusTrap } from "../../lib/a11y/useFocusTrap";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // focus trap（初期 focus / Tab ループ / Esc→onClose / previousFocus 復帰）は単一 source へ委譲。
  // unified-sidebar-shell Task E / I-E6: SidebarDrawer と同一 hook を共有し trap の重複を排す。
  useFocusTrap(open, onClose, dialogRef);

  if (!open) return null;
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <h2 id="drawer-title">{title}</h2>
      {children}
    </div>
  );
}
