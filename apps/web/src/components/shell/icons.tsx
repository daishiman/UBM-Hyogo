import type { ReactNode } from "react";
import type { ShellNavItemId } from "./shell-config";

function I({ d }: { readonly d: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const PATHS: Record<ShellNavItemId, string> = {
  home: "M3 11l9-8 9 8M5 9v11h14V9",
  directory:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75",
  register:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6",
  profile:
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  attendance: "M3 21V10M9 21V4M15 21v-7M21 21V8",
  members:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75",
  "tag-queue": "M20.59 13.41 12 22l-9-9V3h10z M7 7h.01",
  schema:
    "M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3zM4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6",
  meeting: "M3 7h18v14H3zM3 7l2-4h14l2 4M8 3v4M16 3v4",
  requests: "M3 13h5l2 3h4l2-3h5M3 13V5h18v8M3 13v6h18v-6",
  identity:
    "M18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9v6M6 15c0-6 12-3 12-9",
  audit: "M4 4h12l4 4v12H4zM8 4v4h4M8 12h8M8 16h8",
};

export function ShellIcon({ id }: { readonly id: ShellNavItemId }): ReactNode {
  return I({ d: PATHS[id] });
}
