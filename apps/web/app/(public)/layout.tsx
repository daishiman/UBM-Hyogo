// task-11: 公開層 layout。PublicHeader / PublicFooter / Container。

import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { PublicHeader } from "../../src/components/public/PublicHeader";

export default function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <>
      <header data-shell="topbar">
        <PublicHeader />
      </header>
      <main data-route="public" data-role="container">
        {children}
      </main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </>
  );
}
