// followup-001 T-5.7: pill-nav primitive（プロトタイプ準拠）。
// Segmented と用途が近いが、プロトタイプは「カウント badge を併設したフィルタ切替」用途で
// active 表現が radiogroup ではなく tablist に近いため新規分離する（共有 primitive 増殖を避けるべく minimal）。
"use client";
import type { ReactNode } from "react";

export interface PillNavOption {
  value: string;
  label: ReactNode;
  count?: number;
}

export interface PillNavProps {
  options: ReadonlyArray<PillNavOption>;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function PillNav({ options, value, onChange, ariaLabel }: PillNavProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="ui-pill-nav">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active ? "true" : undefined}
            className="ui-pill-nav__item"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {typeof opt.count === "number" ? (
              <span aria-hidden="true" className="ui-pill-nav__count">
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
