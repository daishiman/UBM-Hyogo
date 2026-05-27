import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { IconName } from "./icons";

export type IconSize = "sm" | "md" | "lg" | "xl";

const ICON_SIZE_PX: Record<IconSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export interface IconProps {
  readonly name?: IconName;
  readonly size?: IconSize;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function Icon({ name, size = "md", ariaLabel, className, children }: IconProps) {
  const labeled = Boolean(ariaLabel);
  const content = children ?? (name ? iconGlyph(name) : null);
  return (
    <span
      data-component="icon"
      data-size={size}
      className={cn("ui-icon", className)}
      role={labeled ? "img" : undefined}
      aria-label={labeled ? ariaLabel : undefined}
      aria-hidden={labeled ? undefined : true}
    >
      {content}
    </span>
  );
}

export function iconSizeToPx(size: IconSize): number {
  return ICON_SIZE_PX[size];
}

function iconGlyph(name: IconName): ReactNode {
  const common = {
    width: "100%",
    height: "100%",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "chevron-up":
      return (
        <svg {...common}>
          <path d="m18 15-6-6-6 6" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m20 6-11 11-5-5" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );
    case "external-link":
      return (
        <svg {...common}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="m5.5 5.1-3.2 6.5A2 2 0 0 0 2 12.5V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-.2-.9l-3.3-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      );
  }
}
