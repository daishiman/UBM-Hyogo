import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function buttonVariants({
  variant = "ghost",
  size = "md",
  block = false,
  className,
}: Pick<ButtonProps, "variant" | "size" | "block" | "className"> = {}) {
  return cn("ui-button", `ui-button-${variant}`, `ui-button-${size}`, block && "ui-button-block", className);
}

export function Button({
  variant = "ghost",
  size = "md",
  block = false,
  leftIcon,
  rightIcon,
  loading,
  children,
  disabled,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading ? "true" : undefined}
      className={buttonVariants({ variant, size, block, className })}
    >
      {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
    </button>
  );
}
