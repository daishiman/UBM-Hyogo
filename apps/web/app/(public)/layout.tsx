// task-c-public-member-sidebar-shell-integration:
// 公開層 shell を SidebarShell へ統一。旧 topbar header は削除し、PublicFooter は shell 配下へ保持。
// role 判定・nav 構築・UserMenu は SidebarShellServer 内部に閉じる（layout は再実装しない）。
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { LoginRequiredNotice } from "../../src/components/auth/LoginRequiredNotice";
import { PublicFooter } from "../../src/components/public/PublicFooter";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { getSession } from "../../src/lib/session";

export default async function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  // x-pathname は middleware 注入値を優先し、fallback は middleware 未経由のテスト経路を支える。
  const pathname = (await headers()).get("x-pathname") ?? "/";
  let session: Awaited<ReturnType<typeof getSession>> | null = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  if (!session) {
    return <LoginRequiredNotice redirectTo={pathname} />;
  }

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
        routeKey="public"
        sectionRhythm="comfortable"
      >
        {children}
        <PublicFooter />
      </SidebarShellServer>
    </div>
  );
}
