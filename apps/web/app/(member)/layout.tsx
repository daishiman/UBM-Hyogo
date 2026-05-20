import type { ReactNode } from "react";
import { MemberHeader } from "../../src/components/layout/MemberHeader";

export default function MemberLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="member-shell" data-theme="warm" data-testid="member-shell">
      <header data-shell="topbar">
        <MemberHeader />
      </header>
      <main className="member-main" data-route="member">
        {children}
      </main>
    </div>
  );
}
