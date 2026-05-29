"use client";

// issue-276: 選択済み tag を表示し、× で個別削除 / clear-all で一括削除する。

import type { MembersSearch } from "../../lib/url/members-search";
import { SelectedFiltersBar } from "./SelectedFiltersBar.client";

export interface SelectedTagsBarProps {
  selected: string[];
  onRemove: (code: string) => void;
  onClearAll: () => void;
}

export function SelectedTagsBar({
  selected,
  onRemove,
  onClearAll,
}: SelectedTagsBarProps) {
  const search: MembersSearch = {
    q: "",
    zone: "all",
    status: "all",
    tag: selected,
    sort: "recent",
    density: "comfy",
  };

  return (
    <SelectedFiltersBar
      search={search}
      onPatch={(patch) => {
        if (Array.isArray(patch.tag)) {
          const removed = selected.find((code) => !patch.tag?.includes(code));
          if (removed) onRemove(removed);
        }
      }}
      onClearAll={onClearAll}
    />
  );
}
