"use client";

// issue-276: 選択済み tag を表示し、× で個別削除 / clear-all で一括削除する。

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
  if (selected.length === 0) return null;
  return (
    <div data-component="selected-tags-bar">
      <ul data-role="active-tags">
        {selected.map((code) => (
          <li key={code}>
            <button
              type="button"
              data-component="tag-pill"
              aria-selected="true"
              onClick={() => onRemove(code)}
            >
              #{code} ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-role="clear-all"
        onClick={onClearAll}
      >
        すべてクリア
      </button>
    </div>
  );
}
