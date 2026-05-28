import type { ReactNode } from "react";
import type { ChipTone } from "../../lib/tones";

export interface ChipProps {
  tone?: ChipTone;
  // followup-001 T-5.7: dot indicator additive 追加（プロトタイプ準拠）
  dot?: boolean;
  children: ReactNode;
}

export function Chip({ tone = "stone", dot, children }: ChipProps) {
  return (
    <span data-tone={tone} data-dot={dot ? "true" : undefined} className="ui-chip">
      {dot ? <span aria-hidden="true" className="ui-chip__dot" data-testid="chip-dot" /> : null}
      {children}
    </span>
  );
}
