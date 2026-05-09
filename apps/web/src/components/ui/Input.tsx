import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  describedBy?: string;
  inputSize?: "sm" | "md" | "lg";
  invalid?: boolean;
}

export function Input({ describedBy, inputSize = "md", invalid, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-describedby={props["aria-describedby"] ?? describedBy}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      data-size={inputSize}
      className={cn("ui-input", className)}
    />
  );
}
