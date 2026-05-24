import type { ReactNode } from "react";

export interface LoginShellProps {
  readonly children: ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return (
    <main className="auth-shell" data-route="login">
      {children}
    </main>
  );
}
