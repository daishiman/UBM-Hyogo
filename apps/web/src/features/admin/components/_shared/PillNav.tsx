"use client";

export interface PillNavOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface PillNavProps<T extends string> {
  readonly options: ReadonlyArray<PillNavOption<T>>;
  readonly value: T;
  readonly onChange: (next: T) => void;
  readonly ariaLabel: string;
}

export function PillNav<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: PillNavProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex gap-1 rounded-full border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-0.5"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "rounded-full px-3 py-1 text-xs transition",
              selected
                ? "bg-[var(--ubm-color-accent)] text-[var(--ubm-color-surface-panel)]"
                : "text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-panel-2)]",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
