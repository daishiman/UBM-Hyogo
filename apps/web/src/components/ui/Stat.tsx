import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface StatProps extends HTMLAttributes<HTMLDListElement> {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: "neutral" | "up" | "down";
  helpText?: ReactNode;
}

export function Stat({ label, value, delta, tone = "neutral", helpText, className, ...props }: StatProps) {
  return (
    <dl {...props} className={cn("ui-stat", className)} data-tone={tone}>
      <div>
        <dt>{label}</dt>
        <dd>
          <span>{value}</span>
          {delta ? <span>{delta}</span> : null}
          {helpText ? <span>{helpText}</span> : null}
        </dd>
      </div>
    </dl>
  );
}
