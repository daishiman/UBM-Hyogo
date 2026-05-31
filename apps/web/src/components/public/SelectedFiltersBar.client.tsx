"use client";

import { useEffect, useRef } from "react";

import type { MembersSearch } from "../../lib/url/members-search";

interface FilterChip {
  key: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

const ZONE_LABELS: Readonly<Record<string, string>> = {
  "0_to_1": "0→1",
  "1_to_10": "1→10",
  "10_to_100": "10→100",
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  member: "正会員",
  non_member: "非会員",
  academy: "アカデミー",
};

export interface SelectedFiltersBarProps {
  search: MembersSearch;
  onPatch: (patch: Partial<MembersSearch>) => void;
  onClearAll: () => void;
  tagLabels?: Readonly<Record<string, string>>;
  onEmpty?: () => void;
}

export function SelectedFiltersBar({
  search,
  onPatch,
  onClearAll,
  tagLabels = {},
  onEmpty,
}: SelectedFiltersBarProps) {
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusRef = useRef<string | null>(null);
  const chips: FilterChip[] = [];
  const resolveTag = (tag: string) =>
    Object.hasOwn(tagLabels, tag) ? tagLabels[tag] : tag;

  if (search.q) {
    chips.push({
      key: "q",
      label: `検索: ${search.q}`,
      removeLabel: "キーワード絞り込みを解除",
      onRemove: () => onPatch({ q: "" }),
    });
  }
  if (search.zone !== "all" && ZONE_LABELS[search.zone]) {
    chips.push({
      key: "zone",
      label: `区画: ${ZONE_LABELS[search.zone]}`,
      removeLabel: "区画絞り込みを解除",
      onRemove: () => onPatch({ zone: "all" }),
    });
  }
  if (search.status !== "all" && STATUS_LABELS[search.status]) {
    chips.push({
      key: "status",
      label: `種別: ${STATUS_LABELS[search.status]}`,
      removeLabel: "種別絞り込みを解除",
      onRemove: () => onPatch({ status: "all" }),
    });
  }
  for (const tag of search.tag) {
    const label = resolveTag(tag);
    chips.push({
      key: `tag:${tag}`,
      label: `#${label}`,
      removeLabel: `${label} タグ絞り込みを解除`,
      onRemove: () =>
        onPatch({ tag: search.tag.filter((item) => item !== tag) }),
    });
  }

  const chipKeySignature = chips.map((chip) => chip.key).join("|");

  useEffect(() => {
    if (pendingFocusRef.current == null) return;
    const target = chipRefs.current.get(pendingFocusRef.current);
    pendingFocusRef.current = null;
    target?.focus();
  }, [chipKeySignature]);

  const removeWithFocus = (chip: FilterChip, index: number) => {
    const nextChip = chips[index + 1] ?? chips[index - 1] ?? null;
    pendingFocusRef.current = nextChip?.key ?? null;
    if (nextChip == null) {
      onEmpty?.();
    }
    chip.onRemove();
  };

  if (chips.length === 0) return null;

  return (
    <div data-component="selected-filters-bar">
      <ul data-role="active-filters" aria-label="適用中の絞り込み条件">
        {chips.map((chip, index) => (
          <li key={chip.key}>
            <button
              type="button"
              data-component="filter-chip"
              aria-label={chip.removeLabel}
              ref={(node) => {
                if (node) {
                  chipRefs.current.set(chip.key, node);
                } else {
                  chipRefs.current.delete(chip.key);
                }
              }}
              onClick={() => removeWithFocus(chip, index)}
            >
              {chip.label} ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" data-role="clear-all" onClick={onClearAll}>
        絞り込みをクリア
      </button>
    </div>
  );
}
