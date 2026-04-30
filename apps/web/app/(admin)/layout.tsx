// 06c: admin gate + AdminSidebar 共通 shell
// 不変条件 #11: session.isAdmin !== true は redirect。
// middleware.ts は配置しない（layout 内 auth() で完結、Edge cost 削減）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "../../src/lib/session";
import { AdminSidebar } from "../../src/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");
  return (
    <div className="admin-shell" data-testid="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
