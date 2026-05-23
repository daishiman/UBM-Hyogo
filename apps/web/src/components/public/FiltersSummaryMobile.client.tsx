"use client";

// issue-276: mobile viewport (<=640px) で MemberFilters の折りたたみ summary 行。
// 展開状態は React state のみで管理し URL には乗せない（不変条件 #8 維持）。

export interface FiltersSummaryMobileProps {
  q: string;
  zone: string;
  status: string;
  tagCount: number;
  expanded: boolean;
  onToggle: () => void;
}

export function FiltersSummaryMobile({
  q,
  zone,
  status,
  tagCount,
  expanded,
  onToggle,
}: FiltersSummaryMobileProps) {
  const text = `絞り込み中: ${q || "—"} / zone:${zone} / status:${status} / tag×${tagCount}`;
  return (
    <button
      type="button"
      data-component="filters-summary-mobile"
      data-role="filters-summary-mobile"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span data-role="filters-summary-text">{text}</span>
      <span data-role="filters-summary-caret" aria-hidden="true">
        {expanded ? "▲" : "▼"}
      </span>
    </button>
  );
}
