import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: "neutral" | "up" | "down";
  helpText?: ReactNode;
}

export function Stat({ label, value, delta, tone = "neutral", helpText, className, ...props }: StatProps) {
  return (
    <div {...props} className={cn("ui-stat", className)} data-tone={tone}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {delta ? <p>{delta}</p> : null}
      {helpText ? <p>{helpText}</p> : null}
    </div>
  );
}
