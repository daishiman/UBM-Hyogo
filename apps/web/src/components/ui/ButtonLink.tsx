import type { AnchorHTMLAttributes, ReactNode } from "react";
import { buttonVariants } from "./Button";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "accent" | "ghost" | "soft" | "danger" | "secondary";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

/**
 * ButtonLink — アンカー型ボタンの正本（`<a data-variant>` / `.ui-button-*` 直書きを一本化）。
 * Button.tsx と同一の `buttonVariants` を再利用し className/data 属性を完全一致させる（視覚等価）。
 */
export function ButtonLink({
  variant = "ghost",
  size = "md",
  block = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}: ButtonLinkProps) {
  const visualVariant = variant === "secondary" ? "ghost" : variant;
  return (
    <a {...props} data-variant={variant} className={buttonVariants({ variant: visualVariant, size, block, className })}>
      {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
    </a>
  );
}
