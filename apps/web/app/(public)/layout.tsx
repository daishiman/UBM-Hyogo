// parallel-03 S-01: Public AppShell。data-theme="warm" / data-shell / data-route 契約。
import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { PublicHeader } from "../../src/components/public/PublicHeader";

export default function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
    >
      <header data-shell="topbar">
        <PublicHeader />
      </header>
      <main data-route="public">{children}</main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
