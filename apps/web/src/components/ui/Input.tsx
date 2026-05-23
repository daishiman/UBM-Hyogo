import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  describedBy?: string;
  inputSize?: "sm" | "md" | "lg";
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { describedBy, inputSize = "md", invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      {...props}
      aria-describedby={props["aria-describedby"] ?? describedBy}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      data-size={inputSize}
      className={cn("ui-input", className)}
    />
  );
});
