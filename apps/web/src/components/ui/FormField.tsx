import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface FormFieldProps {
  readonly name: string;
  readonly label: ReactNode;
  readonly error?: string;
  readonly helper?: ReactNode;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: ReactElement<{
    id?: string;
    name?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}

export function FormField({ name, label, error, helper, required, className, children }: FormFieldProps) {
  const reactId = useId();
  const inputId = `${name}-${reactId}`;
  const actualInputId = children.props.id ?? inputId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  const childProps: {
    id: string;
    name: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  } = {
    id: actualInputId,
    name: children.props.name ?? name,
  };
  const ariaInvalid = error ? true : children.props["aria-invalid"];
  if (ariaInvalid !== undefined) childProps["aria-invalid"] = ariaInvalid;
  const ariaDescribedBy = describedBy ?? children.props["aria-describedby"];
  if (ariaDescribedBy !== undefined) childProps["aria-describedby"] = ariaDescribedBy;
  const child = isValidElement(children) ? cloneElement(children, childProps) : children;

  return (
    <div
      data-component="form-field"
      data-invalid={error ? "true" : undefined}
      className={cn("ui-form-field", className)}
    >
      <label htmlFor={actualInputId} className="ui-form-field__label">
        {label}
        {required ? (
          <span aria-hidden="true" className="ui-form-field__required">
            *
          </span>
        ) : null}
      </label>
      {child}
      {helper && !error ? (
        <p id={helperId} className="ui-form-field__helper">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} data-component="form-error" role="alert" className="ui-form-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
