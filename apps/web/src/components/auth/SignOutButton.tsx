"use client";

import { useState, type ReactElement } from "react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/Button";

export interface SignOutButtonProps {
  readonly className?: string;
  readonly label?: string;
  readonly redirectTo?: string;
  readonly variant?: "default" | "menu-item";
}

export function SignOutButton({
  className,
  label = "ログアウト",
  redirectTo = "/login",
  variant = "default",
}: SignOutButtonProps): ReactElement {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      await signOut({ redirectTo });
    } catch {
      setIsPending(false);
    }
  };

  const mergedClassName =
    variant === "menu-item"
      ? `ui-sidebar-user-menu-item ${className ?? ""}`.trim()
      : className;

  return (
    <Button
      type="button"
      className={mergedClassName}
      data-testid="sign-out-button"
      data-variant={variant}
      role={variant === "menu-item" ? "menuitem" : undefined}
      aria-label={label}
      loading={isPending}
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "ログアウト中..." : label}
    </Button>
  );
}
