"use client";

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
}

export function SelectedFiltersBar({
  search,
  onPatch,
  onClearAll,
}: SelectedFiltersBarProps) {
  const chips: FilterChip[] = [];

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
    chips.push({
      key: `tag:${tag}`,
      label: `#${tag}`,
      removeLabel: `${tag} タグ絞り込みを解除`,
      onRemove: () =>
        onPatch({ tag: search.tag.filter((item) => item !== tag) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div data-component="selected-filters-bar">
      <ul data-role="active-filters" aria-label="適用中の絞り込み条件">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              data-component="filter-chip"
              aria-label={chip.removeLabel}
              onClick={chip.onRemove}
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
