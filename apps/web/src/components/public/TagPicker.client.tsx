"use client";

import type { ReactNode } from "react";

// issue-276: 公開メンバー一覧 FilterBar の tag chip picker。
// 候補 chip は role="switch" + aria-checked で選択状態を表す。
// 上限到達時は未選択 chip を aria-disabled にし、polite hint を表示する。

export interface TagPickerOption {
  code: string;
  label: string;
  count: number;
}

export interface TagPickerProps {
  options: TagPickerOption[];
  selected: string[];
  max: number;
  onToggle: (code: string) => void;
  heading?: ReactNode;
}

export function TagPicker({
  options,
  selected,
  max,
  onToggle,
  heading,
}: TagPickerProps) {
  const reached = selected.length >= max;
  if (options.length === 0) return null;
  return (
    <div data-component="tag-picker">
      {heading ? <div data-role="tag-picker-heading">{heading}</div> : null}
      <ul data-role="tag-picker-options">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.code);
          const isDisabled = reached && !isSelected;
          return (
            <li key={opt.code}>
              <button
                type="button"
                role="switch"
                aria-checked={isSelected}
                aria-disabled={isDisabled || undefined}
                data-component="tag-pill"
                data-tag-code={opt.code}
                onClick={() => {
                  if (isDisabled) return;
                  onToggle(opt.code);
                }}
              >
                #{opt.label} <span data-role="tag-count">({opt.count})</span>
              </button>
            </li>
          );
        })}
      </ul>
      {reached ? (
        <p data-role="tag-limit-hint" aria-live="polite">
          これ以上選択できません（上限 {max} 件）
        </p>
      ) : null}
    </div>
  );
}
