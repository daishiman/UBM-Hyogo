// unified-sidebar-shell-public-and-admin Task A: SidebarShell の server entry。
// getSession() → role 判定 → buildNavForRole() → schemaDiffCount(admin のみ) → <SidebarShell />。
// getSession 失敗（null）時は role=viewer にフォールバック（throw しない）。
import type { ReactElement, ReactNode } from "react";
import { getSession } from "../../lib/session";
import { loadSchemaDiffCount } from "../../lib/admin/schema-diff-count";
import { buildNavForRole, type ShellRole } from "./shell-config";
import { SidebarShell } from "./SidebarShell";

function resolveInitials(name: string | undefined, email: string): string {
  const base = (name && name.trim()) || email;
  return base.trim().charAt(0).toUpperCase() || "?";
}

export async function SidebarShellServer({
  activePath,
  children,
  mobileTriggerSlot,
}: {
  readonly activePath: string;
  readonly children: ReactNode;
  readonly mobileTriggerSlot: ReactNode;
}): Promise<ReactElement> {
  const session = await getSession();
  const role: ShellRole = session ? (session.isAdmin ? "admin" : "member") : "viewer";

  const schemaDiffCount = role === "admin" ? await loadSchemaDiffCount() : 0;
  const navGroups = buildNavForRole(role, { schemaDiffCount });

  const user =
    session != null
      ? {
          displayName: session.name ?? session.email,
          email: session.email,
          initials: resolveInitials(session.name, session.email),
        }
      : null;

  return (
    <SidebarShell
      role={role}
      user={user}
      navGroups={navGroups}
      activePath={activePath}
      mobileTriggerSlot={mobileTriggerSlot}
    >
      {children}
    </SidebarShell>
  );
}
