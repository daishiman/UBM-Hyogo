import type { ReactNode } from "react";
import { MemberHeader } from "../../src/components/layout/MemberHeader";

export default function MemberLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="member-shell" data-testid="member-shell">
      <MemberHeader />
      <main className="member-main">{children}</main>
    </div>
  );
}
