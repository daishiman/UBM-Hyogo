// Task A — SidebarShell の Server entry。
// session を取得して role を判定し、nav を組み立てて Client の <SidebarShell /> へ渡す。
// 呼出側 layout（Task C）は role 判定・nav 構築・UserMenu 組み立てを再実装しない。
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { safeServerFetch } from "../../lib/admin/safe-server-fetch";
import { getSession, type SessionUser } from "../../lib/session";
import type { SchemaDiffListView } from "../admin/SchemaDiffPanel";
import { SidebarShell } from "./SidebarShell";
import { buildNavForRole, type ShellRole } from "./shell-config";
import { parseShellCollapsedCookie, SHELL_COLLAPSE_COOKIE_NAME } from "./shell-collapse-cookie";

function resolveRole(session: SessionUser | null): ShellRole {
  if (!session) return "viewer";
  return session.isAdmin ? "admin" : "member";
}

function resolveInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return source.charAt(0).toUpperCase();
}

async function loadSchemaDiffCount(): Promise<number> {
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return result.data.items.filter((item) => item.status === "queued").length;
}

async function readInitialCollapsed(): Promise<boolean | null> {
  try {
    const store = await cookies();
    return parseShellCollapsedCookie(store.get(SHELL_COLLAPSE_COOKIE_NAME)?.value ?? null);
  } catch {
    return null;
  }
}

export async function SidebarShellServer({
  activePath,
  children,
  mobileTriggerSlot,
  routeKey,
  sectionRhythm,
}: {
  readonly activePath: string;
  readonly children: ReactNode;
  readonly mobileTriggerSlot: ReactNode;
  readonly routeKey?: string;
  readonly sectionRhythm?: string;
}) {
  // getSession 失敗時も throw せず viewer へ fall back（不変条件: shell は fail-open に閉じる）。
  let session: SessionUser | null = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  const role = resolveRole(session);
  const schemaDiffCount = role === "admin" ? await loadSchemaDiffCount() : 0;
  const navGroups = buildNavForRole(role, { schemaDiffCount });
  const initialCollapsed = await readInitialCollapsed();

  const user = session
    ? {
        displayName: session.name ?? session.email,
        email: session.email,
        initials: resolveInitials(session.name ?? "", session.email),
      }
    : null;

  return (
    <SidebarShell
      role={role}
      user={user}
      navGroups={navGroups}
      activePath={activePath}
      mobileTriggerSlot={mobileTriggerSlot}
      initialCollapsed={initialCollapsed}
      {...(routeKey !== undefined ? { routeKey } : {})}
      {...(sectionRhythm !== undefined ? { sectionRhythm } : {})}
    >
      {children}
    </SidebarShell>
  );
}
