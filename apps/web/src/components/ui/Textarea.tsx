import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  describedBy?: string;
}

export function Textarea({ describedBy, ...props }: TextareaProps) {
  return <textarea {...props} aria-describedby={describedBy} />;
}
