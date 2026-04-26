import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  describedBy?: string;
}

export function Input({ describedBy, ...props }: InputProps) {
  return <input {...props} aria-describedby={describedBy} />;
}
