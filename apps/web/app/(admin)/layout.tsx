// admin-shell-topbar-sidebar-integration:
// - AdminTopbar (固定 breadcrumb 文字列 / 空 aria-hidden actions slot) を撤去し page-head 集約に統一
// - AdminSidebar に schemaDiffCount / userDisplayName / userEmail を server boundary で注入
// 不変条件 #11 維持: session.isAdmin !== true は redirect（root proxy.ts と layout 内 auth() の二段防御）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { safeServerFetch } from "../../src/lib/admin/safe-server-fetch";
import { getSession } from "../../src/lib/session";
import type { SchemaDiffListView } from "../../src/components/admin/SchemaDiffPanel";

export const dynamic = "force-dynamic";

async function loadSchemaDiffCount(): Promise<number> {
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return result.data.items.filter((item) => item.status === "queued").length;
}

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");

  const schemaDiffCount = await loadSchemaDiffCount();

  return (
    <div
      className="ubm-admin-shell grid min-h-screen grid-cols-1 bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)] md:grid-cols-[272px_1fr]"
      data-theme="cool"
      data-route-group="admin"
      data-auth-state="admin"
      data-shell-mode="sidebar"
      data-testid="admin-shell"
    >
      <aside
        className="hidden border-r border-[var(--ubm-color-border-default)] md:block"
        data-shell="sidebar"
      >
        <AdminSidebar
          schemaDiffCount={schemaDiffCount}
          userDisplayName={session.name ?? ""}
          userEmail={session.email}
        />
      </aside>
      <main
        className="flex min-w-0 flex-col gap-4 p-4 md:p-6"
        data-route="admin"
        data-section-rhythm="compact"
      >
        {children}
      </main>
    </div>
  );
}
