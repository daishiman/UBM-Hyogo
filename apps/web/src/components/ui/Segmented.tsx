import type { HTMLAttributes } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
  sublabel?: string;
  describedBy?: string;
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
          aria-describedby={opt.describedBy}
          aria-label={opt.label}
          data-density={opt.value}
          onClick={() => onChange(opt.value)}
        >
          <span data-role="segmented-label">{opt.label}</span>
          {opt.sublabel ? (
            <span data-role="segmented-sublabel" aria-hidden="true">
              {opt.sublabel}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
