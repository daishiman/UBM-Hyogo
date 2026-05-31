import type { ReactNode } from "react";
import { getSession, type SessionUser } from "@/lib/session";
import { SidebarShell, type SidebarShellUser } from "./SidebarShell";
import { buildNavForRole, type ShellRole } from "./shell-config";

function resolveRole(session: SessionUser | null): ShellRole {
  if (!session) return "viewer";
  return session.isAdmin ? "admin" : "member";
}

function deriveInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (!source) return "?";
  const chars = Array.from(source);
  return chars.slice(0, 2).join("").toUpperCase();
}

function toShellUser(session: SessionUser | null): SidebarShellUser {
  if (!session) return null;
  const displayName = session.name ?? session.email;
  return {
    displayName,
    email: session.email,
    initials: deriveInitials(displayName, session.email),
  };
}

async function safeGetSession(): Promise<SessionUser | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

export type SidebarShellServerProps = {
  activePath: string;
  children: ReactNode;
  mobileTriggerSlot?: ReactNode;
  userMenuSlot?: ReactNode;
  schemaDiffCount?: number;
};

export async function SidebarShellServer({
  activePath,
  children,
  mobileTriggerSlot,
  userMenuSlot,
  schemaDiffCount,
}: SidebarShellServerProps) {
  const session = await safeGetSession();
  const role = resolveRole(session);
  const navGroups = buildNavForRole(
    role,
    role === "admin" ? { schemaDiffCount: schemaDiffCount ?? 0 } : undefined,
  );
  const user = toShellUser(session);
  return (
    <SidebarShell
      role={role}
      user={user}
      navGroups={navGroups}
      activePath={activePath}
      mobileTriggerSlot={mobileTriggerSlot}
      userMenuSlot={userMenuSlot}
    >
      {children}
    </SidebarShell>
  );
}
