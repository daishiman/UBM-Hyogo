// parallel-03 S-03: Member AppShell。data-theme="warm" / data-shell / data-route 契約。
import type { ReactNode } from "react";

import { MemberHeader } from "../../src/components/layout/MemberHeader";

export default function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="member"
      data-testid="member-shell"
    >
      <header data-shell="topbar">
        <MemberHeader />
      </header>
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="member">
        {children}
      </main>
    </div>
  );
}
