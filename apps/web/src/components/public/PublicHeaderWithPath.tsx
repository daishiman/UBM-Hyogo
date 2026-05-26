"use client";

import { usePathname } from "next/navigation";

import {
  PublicHeader,
  type PublicHeaderCurrentUser,
} from "./PublicHeader";

export interface PublicHeaderWithPathProps {
  currentUser?: PublicHeaderCurrentUser | null;
}

export function PublicHeaderWithPath({
  currentUser = null,
}: PublicHeaderWithPathProps) {
  const pathname = usePathname();
  return <PublicHeader currentPath={pathname} currentUser={currentUser} />;
}
