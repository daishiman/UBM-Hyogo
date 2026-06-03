import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      data-theme="warm"
      data-route-group="auth"
      data-shell-mode="bare"
      data-testid="auth-shell"
    >
      {children}
    </div>
  );
}
