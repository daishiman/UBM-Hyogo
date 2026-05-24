import type { HTMLAttributes } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
  ...rest
}: SegmentedProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} {...rest}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
