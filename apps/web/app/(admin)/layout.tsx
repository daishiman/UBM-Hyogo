// admin-layout-sidebar-shell-migration:
// - 旧 AdminSidebar（client）を撤去し SidebarShellServer（Task A）へ委譲。
// - layout の責務を auth guard + shell 呼び出し + admin shell DOM contract 維持へ縮約。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（root proxy.ts と layout guard の二段防御）。
// schemaDiffCount は SidebarShellServer が内部算出（apps/web/src/lib/admin/schema-diff-count.ts）。
// dev #1028 で SidebarShell が semantic <main>（data-shell="main" / data-route=routeKey）を内部描画する
// 統一版へ昇格したため、main の二重化を避けて routeKey="admin" / sectionRhythm="compact" を渡し、
// admin 固有 padding は main 内の wrapper div で保持する（(member)/(public) layout と同じ消費形）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server"; // Task A
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger"; // Task E

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin"); // AC-3: 既存契約維持
  if (!session.isAdmin) redirect("/login?gate=forbidden"); // AC-4: fail-closed

  return (
    <div
      className="ubm-admin-shell min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-testid="admin-shell"
      data-theme="cool"
      data-route-group="admin"
      data-auth-state="admin"
      data-shell-mode="sidebar"
    >
      <SidebarShellServer
        activePath="/admin"
        mobileTriggerSlot={<SidebarMobileTrigger />}
        routeKey="admin"
        sectionRhythm="compact"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarShellServer>
    </div>
  );
}
