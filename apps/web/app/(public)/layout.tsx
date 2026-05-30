// unified-sidebar-shell / Task C: 公開層を共通 SidebarShell へ統合。
// 旧 PublicHeader を撤去し、role はサーバ側 SidebarShellServer が session から判定する。
import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export default async function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div data-theme="warm" data-route-group="public" data-shell-mode="sidebar">
      <SidebarShellServer mobileTriggerSlot={<SidebarMobileTrigger />}>
        <div
          className="flex min-h-full flex-col"
          data-route="public"
          data-section-rhythm="comfortable"
        >
          <div className="flex-1">{children}</div>
          <PublicFooter />
        </div>
      </SidebarShellServer>
    </div>
  );
}
