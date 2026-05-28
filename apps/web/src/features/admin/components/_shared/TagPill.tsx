"use client";
import type { ReactNode } from "react";

export interface TagPillProps {
  readonly children: ReactNode;
  readonly selected?: boolean;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly title?: string;
}

export function TagPill({
  children,
  selected = false,
  onClick,
  disabled = false,
  title,
}: TagPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={title}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
        selected
          ? "border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent-ink)]"
          : "border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] text-[var(--ubm-color-text-secondary)]",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-[var(--ubm-color-surface-panel-2)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
