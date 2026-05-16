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
  const px = ICON_SIZE_PX[size];
  const labeled = Boolean(ariaLabel);
  const content = children ?? (name ? <span aria-hidden="true">{iconGlyph(name)}</span> : null);
  return (
    <span
      data-component="icon"
      data-size={size}
      className={cn("ui-icon", className)}
      style={{ display: "inline-flex", width: px, height: px, lineHeight: 0 }}
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

function iconGlyph(name: IconName): string {
  switch (name) {
    case "chevron-down":
      return "⌄";
    case "chevron-up":
      return "⌃";
    case "x":
      return "×";
    case "search":
      return "⌕";
    case "check":
      return "✓";
    case "menu":
      return "☰";
    case "external-link":
      return "↗";
  }
}
