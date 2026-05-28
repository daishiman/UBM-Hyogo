// parallel-03 S-01 / task-a: Public AppShell。data-theme="warm" / data-shell / data-route 契約。
// task-a で async layout 化し、getAuthView() 経由で PublicHeader に session 配信。
import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { PublicHeader } from "../../src/components/public/PublicHeader";
import { getAuthView } from "../../src/lib/auth-view/getAuthView";

export default async function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const authView = await getAuthView();
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
      data-auth-state={authView.kind}
    >
      <header data-shell="topbar">
        <PublicHeader authView={authView} />
      </header>
      <main data-route="public" data-section-rhythm="comfortable">{children}</main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
