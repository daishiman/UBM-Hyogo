"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className, id, ...props }, ref) {
    const input = (
      <input
        ref={ref}
        id={id}
        {...props}
        type="checkbox"
        className={cn("ui-checkbox__input", className)}
      />
    );

    if (label === undefined) return input;

    return (
      <label className="ui-checkbox" htmlFor={id}>
        {input}
        <span className="ui-checkbox__label">{label}</span>
      </label>
    );
  },
);
