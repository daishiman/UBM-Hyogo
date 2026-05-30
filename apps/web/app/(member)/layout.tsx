// unified-sidebar-shell / Task C: 会員層を共通 SidebarShell へ統合。
// 旧 MemberHeader を撤去。admin 権限ユーザーが /profile を見た場合は ADMIN グループも出る。
import type { ReactNode } from "react";

import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export default async function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div data-theme="warm" data-route-group="member" data-shell-mode="sidebar">
      <SidebarShellServer mobileTriggerSlot={<SidebarMobileTrigger />}>
        <div
          className="flex flex-col gap-4 p-4 md:p-6"
          data-route="member"
          data-section-rhythm="comfortable"
        >
          {children}
        </div>
      </SidebarShellServer>
    </div>
  );
}
