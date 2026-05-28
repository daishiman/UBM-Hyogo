"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "../ui/Chip";
import { isActive } from "./isActive";

export type AdminSidebarBadgeTone = "warn" | "info" | "neutral";

export interface AdminSidebarNavItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly badge?: { readonly tone: AdminSidebarBadgeTone; readonly count: number } | null;
}

const TONE_TO_CHIP: Record<AdminSidebarBadgeTone, "amber" | "cool" | "stone"> = {
  warn: "amber",
  info: "cool",
  neutral: "stone",
};

export function AdminSidebarNavItem({ href, label, icon, badge }: AdminSidebarNavItemProps) {
  const pathname = usePathname() ?? "";
  const active = isActive(href, pathname);
  const showBadge = badge && badge.count > 0;
  return (
    <li>
      <Link
        href={href}
        data-active={active ? "true" : "false"}
        data-component="admin-nav-item"
        aria-current={active ? "page" : undefined}
        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--ubm-color-surface-active)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent)]"
      >
        <span data-component="admin-nav-icon" aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {showBadge ? (
          <Chip tone={TONE_TO_CHIP[badge.tone]}>{badge.count}</Chip>
        ) : null}
      </Link>
    </li>
  );
}
