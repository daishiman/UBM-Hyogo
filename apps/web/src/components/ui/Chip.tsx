import type { ReactNode } from "react";
import type { ChipTone } from "../../lib/tones";

export interface ChipProps {
  tone?: ChipTone;
  children: ReactNode;
}

export function Chip({ tone = "stone", children }: ChipProps) {
  return <span data-tone={tone}>{children}</span>;
}
