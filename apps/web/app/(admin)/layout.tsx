// parallel-03 S-02: Admin AppShell。data-theme="cool" / data-shell / data-route 契約。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（middleware と二段防御）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
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
      className="ubm-admin-shell grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)] md:grid-cols-[240px_1fr]"
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
      <header
        className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
        data-shell="topbar"
      >
        <div
          className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
          data-component="admin-breadcrumb-slot"
        >
          管理
        </div>
        <div aria-hidden="true" data-component="admin-topbar-actions" />
      </header>
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="admin">
        {children}
      </main>
    </div>
  );
}
