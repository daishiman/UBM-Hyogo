// Lane C: PageShell(bare・max-width=narrow) へ移行（AC-4/AC-5）。
// auth-shell クラスは既存 CSS を維持するため className で追加。
import type { ReactNode } from "react";
import { PageShell } from "@/components/ui/layout";

export interface LoginShellProps {
  readonly children: ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return (
    <main className="auth-shell" data-route="login">
      <PageShell maxWidth="narrow" background="bare">
        {children}
      </PageShell>
    </main>
  );
}
