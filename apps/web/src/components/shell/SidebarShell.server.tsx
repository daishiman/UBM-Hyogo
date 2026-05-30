// unified-sidebar-shell / Task A: shell の server boundary。
// getSession() → role 判定 → buildNavForRole() → <SidebarShell />。
// admin の場合のみ schemaDiffCount を await して schema nav へ warn badge を渡す。
import type { ReactNode } from "react";
import { getSession, type SessionUser } from "../../lib/session";
import type { SchemaDiffListView } from "../admin/SchemaDiffPanel";
import { SidebarShell } from "./SidebarShell";
import { buildNavForRole, type ShellRole } from "./shell-config";

function resolveRole(session: SessionUser | null): ShellRole {
  if (!session) return "viewer";
  return session.isAdmin ? "admin" : "member";
}

function deriveInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

async function loadSchemaDiffCount(): Promise<number> {
  // admin role 時のみ評価。動的 import で sentry/admin-fetch を public/member バンドルへ載せない。
  const { safeServerFetch } = await import("../../lib/admin/safe-server-fetch");
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return result.data.items.filter((item) => item.status === "queued").length;
}

export async function SidebarShellServer({
  children,
  mobileTriggerSlot,
}: {
  children: ReactNode;
  mobileTriggerSlot: ReactNode;
}): Promise<ReactNode> {
  let session: SessionUser | null = null;
  try {
    session = await getSession();
  } catch {
    // 不変条件 #11 / Task A: getSession 失敗時は viewer へ fail-closed。
    session = null;
  }

  const role = resolveRole(session);
  const schemaDiffCount = role === "admin" ? await loadSchemaDiffCount() : 0;
  const navGroups = buildNavForRole(role, { schemaDiffCount });

  const user =
    session !== null
      ? {
          displayName: session.name ?? session.email,
          email: session.email,
          initials: deriveInitials(session.name ?? "", session.email),
        }
      : null;

  return (
    <SidebarShell
      role={role}
      user={user}
      navGroups={navGroups}
      mobileTriggerSlot={mobileTriggerSlot}
    >
      {children}
    </SidebarShell>
  );
}
