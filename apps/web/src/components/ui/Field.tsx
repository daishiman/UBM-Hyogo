import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";

export interface FieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  error?: string;
  hint?: string;
  children:
    | ReactNode
    | ((controlProps: {
        id: string;
        "aria-describedby"?: string;
        "aria-invalid"?: boolean;
      }) => ReactNode);
  className?: string;
}

export function Field({
  id,
  label,
  required,
  optional,
  description,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description || hint ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    id: controlId,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(error ? { "aria-invalid": true } : {}),
  };
  return (
    <div className={cn("ui-field", className)}>
      <label htmlFor={controlId}>
        {label}
        {required ? " *必須" : null}
        {optional ? " 任意" : null}
      </label>
      {typeof children === "function" ? children(controlProps) : children}
      {(description || hint) && <p id={descriptionId}>{description ?? hint}</p>}
      {error ? <p id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
