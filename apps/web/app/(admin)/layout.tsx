// task-15 W5 / parallel-03 S-02: admin gate + 2 カラム grid + AdminSidebar + Admin AppShell。
// data-theme="cool" / data-shell / data-route 契約。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（root proxy.ts と layout 内 auth() の二段防御）。
// admin 配下に proxy.ts は配置しない（root proxy.ts と layout 内 auth() で完結、Edge cost 削減）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
import { AdminTopbarActions } from "../../src/features/admin/components/_layout/AdminTopbarActions";
import { getSession } from "../../src/lib/session";

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
    <div
      className="ubm-admin-shell grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)] md:grid-cols-[272px_1fr]"
      data-theme="cool"
      data-route-group="admin"
      data-testid="admin-shell"
    >
      <aside
        className="border-r border-[var(--ubm-color-border-default)] md:row-span-2"
        data-shell="sidebar"
      >
        <AdminSidebar />
      </aside>
      <AdminTopbar actions={<AdminTopbarActions />} />
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="admin" data-section-rhythm="compact">
        {children}
      </main>
    </div>
  );
}
