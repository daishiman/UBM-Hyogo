import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface ProseProps {
  children: ReactNode;
  /** 文字サイズリズム。default / compact */
  size?: "default" | "compact";
  className?: string;
}

/**
 * Prose — 本文タイポの正本（privacy/terms/長文の文字統一）。
 * `.ui-prose` 子孫の h2/h3/p/ul/ol/li/a/strong にタイポ・余白トークンを適用する（presentational / stateless）。
 */
export function Prose({ children, size = "default", className }: ProseProps) {
  return (
    <div className={cn("ui-prose", className)} data-component="prose" data-size={size}>
      {children}
    </div>
  );
}
