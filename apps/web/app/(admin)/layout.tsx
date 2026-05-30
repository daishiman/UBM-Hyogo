// unified-sidebar-shell / Task D: admin 層を共通 SidebarShell へ移行。
// 旧 AdminSidebar / schemaDiff 取得は SidebarShellServer に集約。layout の責務は guard + shell 呼び出しのみ。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（root proxy.ts と layout 内 auth() の二段防御）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");

  return (
    <div data-theme="cool" data-route-group="admin" data-shell-mode="sidebar">
      <SidebarShellServer mobileTriggerSlot={<SidebarMobileTrigger />}>
        <div
          className="flex min-w-0 flex-col gap-4 p-4 md:p-6"
          data-route="admin"
          data-section-rhythm="compact"
        >
          {children}
        </div>
      </SidebarShellServer>
    </div>
  );
}
