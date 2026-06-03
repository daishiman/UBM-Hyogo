"use client";

import { useImeSafeInput } from "../../hooks/useImeSafeInput";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function Search({
  value,
  onChange,
  debounceMs,
  placeholder,
  id,
  name,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: SearchProps) {
  const imeInput = useImeSafeInput({
    value,
    onCommit: onChange,
    debounceMs,
  });

  return (
    <div>
      <input
        type="search"
        id={id}
        name={name}
        {...imeInput.inputProps}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      {imeInput.value && (
        <button
          type="button"
          aria-label="クリア"
          onClick={() => imeInput.commitNow("")}
        >
          ×
        </button>
      )}
    </div>
  );
}
