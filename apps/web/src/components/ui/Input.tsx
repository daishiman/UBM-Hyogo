"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { useImeSafeInput } from "../../hooks/useImeSafeInput";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  describedBy?: string;
  imeSafe?: boolean;
  onValueChange?: (value: string) => void;
  inputSize?: "sm" | "md" | "lg";
  invalid?: boolean;
  debounceMs?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    describedBy,
    imeSafe = false,
    inputSize = "md",
    invalid,
    className,
    onValueChange,
    debounceMs,
    ...props
  },
  ref,
) {
  const imeInput = useImeSafeInput({
    value: typeof props.value === "string" ? props.value : "",
    onCommit: onValueChange ?? (() => {}),
    debounceMs,
  });
  const imeProps =
    imeSafe && typeof props.value === "string" && onValueChange
      ? imeInput.inputProps
      : {};

  return (
    <input
      ref={ref}
      {...props}
      {...imeProps}
      aria-describedby={props["aria-describedby"] ?? describedBy}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      data-size={inputSize}
      className={cn("ui-input", className)}
    />
  );
});
