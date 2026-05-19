// task-15 W5: admin gate + 2 カラム grid + AdminSidebar
// 不変条件 #11: session.isAdmin !== true は redirect。
// middleware.ts は配置しない（layout 内 auth() で完結、Edge cost 削減）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "../../src/lib/session";
import { AdminSidebar } from "../../src/components/layout/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");
  return (
    <div
      className="ubm-admin-shell grid min-h-screen grid-cols-1 bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)] md:grid-cols-[240px_1fr]"
      data-theme="cool"
      data-testid="admin-shell"
    >
      <aside
        className="border-r border-[var(--ubm-color-border-default)]"
        data-shell="sidebar"
      >
        <AdminSidebar />
      </aside>
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="admin">
        {children}
      </main>
    </div>
  );
}
