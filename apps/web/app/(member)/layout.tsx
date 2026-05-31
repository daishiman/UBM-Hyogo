// task-c-public-member-sidebar-shell-integration:
// 会員層 shell を SidebarShell へ統一。旧 topbar header は削除（profile/page.tsx の直接 mount も除去）。
// role 判定・nav 構築・UserMenu は SidebarShellServer 内部に閉じる（layout は再実装しない）。
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";

export default async function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "/profile";
  return (
    <div
      data-theme="warm"
      data-route-group="member"
      data-shell-mode="sidebar"
      data-testid="member-shell"
    >
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
        routeKey="member"
        sectionRhythm="comfortable"
      >
        {children}
      </SidebarShellServer>
    </div>
  );
}
