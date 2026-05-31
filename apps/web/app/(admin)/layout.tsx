// unified-sidebar-shell / Task D: admin 層を共通 SidebarShell へ移行。
// 旧 AdminSidebar / AdminTopbar / schemaDiff 取得は SidebarShellServer に集約。
// layout の責務は guard（不変条件 #11: isAdmin 以外は redirect）+ shell 呼び出しのみ。
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");

  const pathname = (await headers()).get("x-pathname") ?? "/admin";
  return (
    <div
      data-theme="cool"
      data-route-group="admin"
      data-shell-mode="sidebar"
      data-auth-state="admin"
      data-testid="admin-shell"
    >
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
        routeKey="admin"
        sectionRhythm="compact"
      >
        {children}
      </SidebarShellServer>
    </div>
  );
}
