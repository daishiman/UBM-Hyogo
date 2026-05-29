// task-c-public-member-sidebar-shell-integration:
// 公開層 shell を SidebarShell へ統一。旧 topbar header は削除し、PublicFooter は shell 配下へ保持。
// role 判定・nav 構築・UserMenu は SidebarShellServer 内部に閉じる（layout は再実装しない）。
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";

export default async function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  // x-pathname は middleware 未注入のため fallback を持つ。active 確定は client の usePathname。
  const pathname = (await headers()).get("x-pathname") ?? "/";
  return (
    <div
      data-theme="warm"
      data-route-group="public"
      data-shell-mode="sidebar"
      data-testid="public-shell"
    >
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
        <PublicFooter />
      </SidebarShellServer>
    </div>
  );
}
