import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

export function Button({ loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={disabled ?? loading} aria-busy={loading ? "true" : undefined}>
      {children}
    </button>
  );
}
