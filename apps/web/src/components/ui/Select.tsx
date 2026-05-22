import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  describedBy?: string;
  invalid?: boolean;
}

export function Select({ options, describedBy, invalid, className, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      aria-describedby={props["aria-describedby"] ?? describedBy}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      className={cn("ui-select", className)}
    >
      {children}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
