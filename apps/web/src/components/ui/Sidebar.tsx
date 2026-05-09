"use client";

import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  label?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export interface SidebarNavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon: ReactNode;
  label: string;
  matchPrefix?: string;
}

export interface SidebarSectionProps {
  title?: string;
  children: ReactNode;
}

function isActiveHref(href: string, matchPrefix?: string): boolean {
  if (typeof window === "undefined") return false;
  const pathname = window.location.pathname;
  return matchPrefix ? pathname.startsWith(matchPrefix) : pathname === href;
}

export function Sidebar({ label = "サイドバー", header, footer, children, className, ...props }: SidebarProps) {
  return (
    <aside {...props} className={cn("ui-sidebar", className)} aria-label={label}>
      {header}
      {children}
      {footer}
    </aside>
  );
}

export function SidebarNavItem({ href, icon, label, matchPrefix, className, ...props }: SidebarNavItemProps) {
  const active = isActiveHref(href, matchPrefix);
  return (
    <a {...props} href={href} className={cn("ui-sidebar-nav-item", className)} aria-current={active ? "page" : undefined}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="ui-sidebar-section">
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
