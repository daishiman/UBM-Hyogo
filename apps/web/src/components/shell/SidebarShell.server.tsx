import type { ReactNode } from "react";
import { getSession } from "../../lib/session";
import { safeServerFetch } from "../../lib/admin/safe-server-fetch";
import { buildNavForRole, type ShellRole } from "./shell-config";
import { SidebarShell, type SidebarShellUser } from "./SidebarShell";

type SchemaDiffListView = { items: ReadonlyArray<{ status: string }> };

async function getSchemaDiffCount(): Promise<number> {
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return result.data.items.filter((item) => item.status === "queued").length;
}

export type SidebarShellServerProps = {
  activePath: string;
  children: ReactNode;
  mobileTriggerSlot: ReactNode;
};

/**
 * SidebarShell の server boundary（Task A）。
 * session → role 判定 → nav 構成 → user prop を解決し、Client SidebarShell へ渡す。
 *
 * getSession 失敗時は role=viewer にフォールバックし throw しない（fail-closed 表示）。
 */
export async function SidebarShellServer({
  activePath,
  children,
  mobileTriggerSlot,
}: SidebarShellServerProps) {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  const role: ShellRole = session ? (session.isAdmin ? "admin" : "member") : "viewer";
  const schemaDiffCount = role === "admin" ? await getSchemaDiffCount() : 0;
  const navGroups = buildNavForRole(role, { schemaDiffCount });

  const user: SidebarShellUser | null = session
    ? {
        displayName: session.name ?? session.email,
        email: session.email,
        initials: (session.name ?? session.email).trim().charAt(0).toUpperCase() || "?",
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
