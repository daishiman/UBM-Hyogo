"use client";

import { useState, type ReactElement } from "react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/Button";

export interface SignOutButtonProps {
  readonly className?: string;
  readonly label?: string;
  readonly redirectTo?: string;
}

export function SignOutButton({
  className,
  label = "ログアウト",
  redirectTo = "/login",
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

  return (
    <Button
      type="button"
      className={className}
      data-testid="sign-out-button"
      aria-label={label}
      loading={isPending}
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "ログアウト中..." : label}
    </Button>
  );
}
