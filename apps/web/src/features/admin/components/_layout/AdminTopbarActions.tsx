"use client";

import type { ReactElement } from "react";
import { SignOutButton } from "../../../../components/auth/SignOutButton";

/**
 * Admin topbar global actions only.
 * Page-specific actions belong in AdminPageHeader.actions, not this island.
 */
export function AdminTopbarActions(): ReactElement {
  return (
    <div className="flex items-center gap-2" data-testid="admin-topbar-actions-island">
      <SignOutButton redirectTo="/login" />
    </div>
  );
}
